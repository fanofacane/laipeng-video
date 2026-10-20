# Claude Code 口播视频（科技风）

参考视频的信息图动画风格（卡片、漏斗/流程、底部字幕条），配色改为深色科技风（深蓝黑底 + 青/紫渐变）。

## 目录
- `src/script.txt` 逐字稿
- `audio/voice.wav` 粗剪后的配音（删停顿、重复、口误，降噪+响度标准化 -16 LUFS）
- `src/index.html` `engine.js` `scenes.js` `style.css` 动画页面（每一帧都由时间 t 决定，可逐帧渲染）
- `src/timing.js` 逐字稿与配音的逐字对齐结果（字幕、画面卡点都用它）
- `tools/` 粗剪 `cut.py`、识别 `run.py`、对齐 `align.py`、渲染 `render.mjs`
- `"out/Claude Code 科技风成片.mp4"` 成片

## 重新生成
```bash
python3 tools/align.py 237.92                     # 对齐（时长 = 配音时长 + 2s 片尾）
node tools/render.mjs stills /tmp/stills 10 50    # 抽帧预览
node tools/render.mjs video out/a.mp4 0 7138 30   # 渲染画面
ffmpeg -i out/a.mp4 -i audio/voice.wav -af apad -t 237.92 -c:v copy -c:a aac -b:a 192k "out/Claude Code 科技风成片.mp4"
```
预览：用浏览器打开 `src/index.html?play`，点击页面播放/暂停。
