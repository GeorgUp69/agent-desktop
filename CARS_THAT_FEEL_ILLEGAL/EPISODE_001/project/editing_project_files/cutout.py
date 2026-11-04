import sys
from PIL import Image
from rembg import remove, new_session
sess = new_session(sys.argv[1])
for src in sys.argv[3:]:
    im = Image.open(src).convert('RGB')
    w, h = im.size
    small = im.resize((w // 2, h // 2), Image.LANCZOS)
    m = remove(small, session=sess, only_mask=True, post_process_mask=True)
    m = m.resize((w, h), Image.LANCZOS)
    name = src.split('/')[-1].split('.')[0]
    m.save(f'{sys.argv[2]}/{name}_mask.png')
    print('mask', name)
