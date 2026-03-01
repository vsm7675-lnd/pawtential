#!/usr/bin/env python3
"""Strip metadata from images and save to breed folders"""
import os
import sys
from PIL import Image

def strip_and_save(src_path, dest_path):
    """Remove all metadata from image and save"""
    try:
        img = Image.open(src_path)
        # Create new image without metadata
        data = list(img.getdata())
        img_clean = Image.new(img.mode, img.size)
        img_clean.putdata(data)
        # Save with high quality
        if dest_path.endswith('.jpg') or dest_path.endswith('.jpeg'):
            img_clean.save(dest_path, 'JPEG', quality=95)
        elif dest_path.endswith('.png'):
            img_clean.save(dest_path, 'PNG')
        else:
            img_clean.save(dest_path, quality=95)
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

def process_upload(filename, species='dog'):
    """Process a single uploaded file"""
    upload_dir = '/home/z/my-project/upload'
    src = os.path.join(upload_dir, filename)
    
    # Generate slug from filename
    name = os.path.splitext(filename)[0]
    slug = name.lower().replace(' ', '-').replace('_', '-')
    slug = ''.join(c for c in slug if c.isalnum() or c == '-')
    
    # Determine destination
    if species.lower() == 'cat':
        dest_dir = '/home/z/my-project/public/images/breeds/cats'
    else:
        dest_dir = '/home/z/my-project/public/images/breeds/dogs'
    
    ext = '.jpg' if filename.lower().endswith(('.jpg', '.jpeg')) else '.png'
    dest = os.path.join(dest_dir, slug + ext)
    
    if strip_and_save(src, dest):
        print(f"✅ {filename} → {slug}{ext}")
        return True
    return False

if __name__ == '__main__':
    if len(sys.argv) > 1:
        process_upload(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else 'dog')
