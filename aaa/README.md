# 「啊」三段拼接 + 文字动效

按顺序拼接 599 → 600 → 601 三段素材（统一为 1080×1080 / 30fps，12.1s），
叠加只用「啊」字的动态排版，动效参考《TYPE IN MOTION》提示词：
3D 翻入、标签弹出、硬币翻转星、穿遮罩滑入、旋转甩出/甩入、逐字掉落、巨字砸落（两帧定格无模糊）、
描边回声、节拍冲击、四向入场 + 星星铺满转场、黄底反色段、巨字横扫、跑马灯矩阵。
运动模糊：每帧 16 个子帧（180° 快门），ffmpeg tmix 求平均。配乐/音效用 numpy 合成（120 BPM），-14 LUFS。

```bash
ffmpeg -i footage/base.mp4 -q:v 2 footage/frames/%04d.jpg   # 素材帧
node tools/render.mjs video out/a.mp4 0 363                  # 渲染（可分段并行）
python3 tools/audio.py && ffmpeg -i out/score_raw.wav -af loudnorm=I=-14 out/score.wav
```
