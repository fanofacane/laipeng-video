import sys, json
from faster_whisper import WhisperModel
m = WhisperModel(sys.argv[3], device="cpu", compute_type="int8", cpu_threads=4)
import numpy as np, subprocess
raw=subprocess.run(["ffmpeg","-v","error","-i",sys.argv[1],"-ar","16000","-ac","1","-f","s16le","-"],capture_output=True).stdout
audio=np.frombuffer(raw,np.int16).astype(np.float32)/32768
segs, info = m.transcribe(audio, language="zh", word_timestamps=True, vad_filter=False,
    initial_prompt="以下是普通话的句子，关于 Claude Code、AI、卡帕西。", condition_on_previous_text=False)
out=[]
for s in segs:
    out.append({"start":s.start,"end":s.end,"text":s.text,"words":[{"s":w.start,"e":w.end,"w":w.word,"p":w.probability} for w in s.words]})
    print(f"[{s.start:7.2f}-{s.end:7.2f}] {s.text}", flush=True)
json.dump(out, open(sys.argv[2],"w"), ensure_ascii=False)
