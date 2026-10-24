# 逐句合成配音（edge-tts），拼接成 audio/voice.wav，并输出 src/timing.js（每句起止 + 逐字时间）
#   python3 tools/tts.py
import asyncio, json, ssl, subprocess, os, sys
import edge_tts, edge_tts.communicate as C
C._SSL_CTX = ssl.create_default_context(cafile=os.environ.get('CA', '/root/.ccr/ca-bundle.crt'))
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOICE, RATE, PITCH = 'zh-CN-YunxiNeural', '-6%', '-3Hz'
PRE, TAIL = 2.6, 5.0          # 开头动画留白、片尾
GAP = {'，': .32, '：': .4, '；': .6, '。': .85, '、': .25}
SECTION = 1.0
SR = 48000

async def synth(text, mp3):
    c = edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH, boundary='WordBoundary')
    words = []
    with open(mp3, 'wb') as f:
        async for ch in c.stream():
            if ch['type'] == 'audio': f.write(ch['data'])
            elif ch['type'] == 'WordBoundary':
                words.append((ch['offset'] / 1e7, ch['duration'] / 1e7, ch['text']))
    return words

def dur(p):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p]))

async def main():
    raw = open(os.path.join(ROOT, 'src/lines.txt'), encoding='utf-8').read().split('\n')
    os.makedirs(os.path.join(ROOT, 'audio/lines'), exist_ok=True)
    lines, t, sec, pend = [], PRE, 0, 0
    for row in raw:
        row = row.strip()
        if not row: continue
        if row == '#': sec += 1; pend += SECTION; continue
        i = len(lines)
        mp3 = os.path.join(ROOT, f'audio/lines/{i:02d}.mp3'); wav = mp3[:-4] + '.wav'
        if not os.path.exists(mp3[:-4] + '.json'):
            words = await synth(row, mp3)
            json.dump(words, open(mp3[:-4] + '.json', 'w'), ensure_ascii=False)
        if not os.path.exists(wav):
            # 去掉首尾静音
            subprocess.check_call(['ffmpeg', '-v', 'error', '-y', '-i', mp3, '-af',
                'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse',
                '-ar', str(SR), '-ac', '1', wav])
        words = json.load(open(mp3[:-4] + '.json'))
        d = dur(wav)
        lead = words[0][0] if words else 0   # 去掉的前导静音（近似）
        t += pend; pend = 0
        # 逐字时间：在每个词的时长里均分
        chars = []; k = 0
        for (o, du, w) in words:
            j = row.find(w, k)
            if j < 0: continue
            while len(chars) < j: chars.append(None)
            for m in range(len(w)): chars.append(t + max(0, o - lead) + du * m / len(w))
            k = j + len(w)
        while len(chars) < len(row): chars.append(None)
        last = t
        for m in range(len(chars)):
            if chars[m] is None: chars[m] = last
            last = chars[m]
        lines.append({'text': row, 'start': round(t, 3), 'end': round(t + d, 3), 'sec': sec,
                      'chars': [round(c, 3) for c in chars]})
        t += d + GAP.get(row[-1], .4)
    total = round(t + TAIL, 2)
    with open(os.path.join(ROOT, 'src/timing.js'), 'w', encoding='utf-8') as f:
        f.write('window.TIMING=' + json.dumps({'duration': total, 'lines': lines}, ensure_ascii=False) + ';\n')
    # 拼接：每句放到它的起点
    args = ['ffmpeg', '-v', 'error', '-y']
    filt = []
    for i, L in enumerate(lines):
        args += ['-i', os.path.join(ROOT, f'audio/lines/{i:02d}.wav')]
        filt.append(f'[{i}]adelay={int(L["start"]*1000)}:all=1[a{i}]')
    filt.append(''.join(f'[a{i}]' for i in range(len(lines))) + f'amix=inputs={len(lines)}:normalize=0,apad=whole_dur={total}[o]')
    args += ['-filter_complex', ';'.join(filt), '-map', '[o]', '-ar', str(SR), os.path.join(ROOT, 'audio/voice.wav')]
    subprocess.check_call(args)
    print('lines', len(lines), 'duration', total)

asyncio.run(main())
