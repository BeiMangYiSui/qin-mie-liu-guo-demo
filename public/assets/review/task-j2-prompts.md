# 任务 J2：S7 三镜头图重生成提示词登记

## 统一风格

- photorealistic / cinematic / low-key dark lighting
- 照片级材质与电影镜头质感
- 禁止卡通、3D 渲染感、简笔画、纸片人、过度饱和
- 三张图均为 1536×864 PNG，画面内不得出现可辨识文字

## `shot_tongfu.png`

**Prompt**

> Photorealistic macro photograph of an ancient Chinese Warring States bronze tally (fu) resting on black velvet inside a dim museum display case. The bronze tally is a flat symmetrical plaque shape, aged dark bronze with subtle green patina in the recesses and worn golden-bronze highlights on raised edges. Fine engraved feather-plume pattern (delicate curved parallel lines like layered bird feathers) covers its surface. A single soft spotlight from above creates a gentle rim light and a faint reflection on the glass case. Shallow depth of field, dark moody background fading to black, cinematic museum lighting, ultra-detailed metal texture, no text, no inscriptions.

**Negative constraints**

- no cookie-like material
- no cartoon outline
- no bright yellow brass
- no text, inscription, seal script, logo, or AI glyphs

## `shot_gaore.png`

**Prompt**

> Photorealistic cinematic shot of a dim modern bedroom at night. A young man lies in bed seen from the side, buried under a heavy quilt, only the outline of his body and the back of his head visible on the pillow. A damp white towel rests on his forehead. On the nightstand: a glass of water, a crumpled tissue. A single warm tungsten bedside lamp casts a weak orange glow, most of the room sinking into deep shadow. The air above the lamp shimmers slightly with heat distortion. Subtle motion blur and soft overexposure near the lamp convey feverish dizziness. Moody, oppressive, intimate atmosphere, dark cinematic realism, no medical equipment, no blood, no text.

**Negative constraints**

- not an abstract blur or full-frame light bloom
- no medical equipment close-up
- no blood or injury
- no bright orange wash
- no text

## `shot_mengye.png`

**Prompt**

> Photorealistic cinematic wide shot of a mountain path at night in heavy rain, cold blue-teal color grading. A lone Warring States soldier stands with his back to the camera in the lower right third of the frame, head slightly turned as if hearing someone call his name. He wears dark Qin-dynasty lamellar armor and a rain-soaked cloak, a long jian sword at his waist. Rain streaks catch faint lightning light, the muddy path reflects a cold sheen, mountains fade into dark mist behind him. Realistic human proportions, figure silhouette sharp against the mist, film grain, anamorphic lens feel, extremely atmospheric, no text.

**Negative constraints**

- no paper-cut figure, block limbs, toy or LEGO-like anatomy
- no front-facing portrait
- no warm color grade
- no text

## 生成与验收说明

本轮仅替换三张镜头图，并新增本提示词登记与 `task-j2-s7-shots-contact-sheet.png`。不修改 S7 呈现代码、剧情文案或配音目录。
