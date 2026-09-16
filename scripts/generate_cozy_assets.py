import math
import os
import subprocess

def clamp(val, low=0, high=255):
    return int(max(low, min(high, round(val))))

def make_ppm(width, height, pixel_fn, filename):
    header = f"P6\n{width} {height}\n255\n".encode('ascii')
    data = bytearray(width * height * 3)
    idx = 0
    for y in range(height):
        ny = y / float(height)
        for x in range(width):
            nx = x / float(width)
            r, g, b = pixel_fn(nx, ny, x, y, width, height)
            data[idx] = clamp(r)
            data[idx+1] = clamp(g)
            data[idx+2] = clamp(b)
            idx += 3
    with open(filename, 'wb') as f:
        f.write(header)
        f.write(data)

def render_banner(theme, width=1280, height=400):
    """
    Renders a cozy illustrated landscape:
    - Smooth sky gradient
    - Soft glowing sun / moon
    - Gentle distant clouds
    - Multiple layers of smooth rolling hills
    - Cozy ambient lighting
    """
    # Color schemes for themes
    if theme == 'sunset':
        # Peach / terracotta / warm pink sunset
        sky_top = (165, 120, 155)
        sky_mid = (245, 160, 130)
        sky_bot = (255, 215, 175)
        sun_color = (255, 235, 190)
        sun_pos = (0.5, 0.45)
        hill1_c = (195, 120, 110)
        hill2_c = (160, 90, 85)
        hill3_c = (120, 65, 65)
    elif theme == 'night':
        # Soft deep navy-gray / muted dark mode with glowing crescent & stars
        sky_top = (25, 30, 48)
        sky_mid = (38, 46, 68)
        sky_bot = (58, 66, 92)
        sun_color = (220, 230, 255)
        sun_pos = (0.7, 0.3)
        hill1_c = (35, 42, 60)
        hill2_c = (28, 33, 48)
        hill3_c = (20, 24, 35)
    elif theme == 'sakura':
        # Delicate blush pink with rosy hills
        sky_top = (235, 205, 215)
        sky_mid = (250, 225, 230)
        sky_bot = (255, 240, 242)
        sun_color = (255, 245, 245)
        sun_pos = (0.5, 0.4)
        hill1_c = (220, 170, 185)
        hill2_c = (195, 135, 155)
        hill3_c = (165, 105, 125)
    elif theme == 'forest':
        # Restful sage greens and misty morning atmosphere
        sky_top = (190, 215, 205)
        sky_mid = (220, 235, 225)
        sky_bot = (240, 248, 240)
        sun_color = (255, 250, 230)
        sun_pos = (0.45, 0.4)
        hill1_c = (150, 185, 160)
        hill2_c = (115, 155, 125)
        hill3_c = (85, 125, 95)
    elif theme == 'cloudy':
        # Cool soft light gray-blue
        sky_top = (175, 195, 215)
        sky_mid = (205, 220, 232)
        sky_bot = (235, 242, 248)
        sun_color = (250, 252, 255)
        sun_pos = (0.55, 0.4)
        hill1_c = (155, 175, 195)
        hill2_c = (125, 145, 165)
        hill3_c = (95, 115, 135)
    else: # 'morning' / default
        # Warm golden cream and soft blue
        sky_top = (175, 210, 228)
        sky_mid = (225, 235, 235)
        sky_bot = (254, 244, 230)
        sun_color = (255, 248, 225)
        sun_pos = (0.5, 0.4)
        hill1_c = (175, 205, 178)
        hill2_c = (135, 175, 140)
        hill3_c = (105, 145, 112)

    def pixel_fn(nx, ny, x, y, w, h):
        # 1. Sky base gradient
        if ny < 0.5:
            t = ny / 0.5
            r = sky_top[0] * (1-t) + sky_mid[0] * t
            g = sky_top[1] * (1-t) + sky_mid[1] * t
            b = sky_top[2] * (1-t) + sky_mid[2] * t
        else:
            t = (ny - 0.5) / 0.5
            r = sky_mid[0] * (1-t) + sky_bot[0] * t
            g = sky_mid[1] * (1-t) + sky_bot[1] * t
            b = sky_mid[2] * (1-t) + sky_bot[2] * t

        # 2. Sun / Moon glow
        dx = (nx - sun_pos[0]) * (w / h)
        dy = (ny - sun_pos[1])
        dist = math.sqrt(dx*dx + dy*dy)
        if dist < 0.65:
            glow = max(0.0, 1.0 - (dist / 0.65))
            glow_intensity = (glow ** 2.2) * 0.75
            r = r * (1 - glow_intensity) + sun_color[0] * glow_intensity
            g = g * (1 - glow_intensity) + sun_color[1] * glow_intensity
            b = b * (1 - glow_intensity) + sun_color[2] * glow_intensity

        # Sun core
        if dist < 0.08:
            core = (1.0 - dist / 0.08) ** 0.5
            r = r * (1 - core) + 255 * core
            g = g * (1 - core) + 255 * core
            b = b * (1 - core) + 245 * core

        # If night, add cozy subtle stars
        if theme == 'night' and ny < 0.6:
            # Deterministic pseudo-random stars
            star_val = math.sin(x * 12.9898 + y * 78.233) * 43758.5453
            star_val -= math.floor(star_val)
            if star_val > 0.993:
                r += 120
                g += 130
                b += 160

        # 3. Rolling Hill 1 (Back, lowest contrast)
        h1_y = 0.52 + 0.06 * math.sin(nx * 4.5 + 0.5) + 0.03 * math.sin(nx * 9.0)
        if ny >= h1_y:
            t_blend = min(1.0, (ny - h1_y) * 15.0)
            r = r * (1 - t_blend) + hill1_c[0] * t_blend
            g = g * (1 - t_blend) + hill1_c[1] * t_blend
            b = b * (1 - t_blend) + hill1_c[2] * t_blend

        # 4. Rolling Hill 2 (Mid)
        h2_y = 0.66 + 0.08 * math.sin(nx * 3.8 + 2.8) + 0.02 * math.cos(nx * 7.5)
        if ny >= h2_y:
            t_blend = min(1.0, (ny - h2_y) * 15.0)
            r = r * (1 - t_blend) + hill2_c[0] * t_blend
            g = g * (1 - t_blend) + hill2_c[1] * t_blend
            b = b * (1 - t_blend) + hill2_c[2] * t_blend

        # 5. Rolling Hill 3 (Foreground, rich tone)
        h3_y = 0.80 + 0.06 * math.sin(nx * 3.1 + 4.2) + 0.025 * math.sin(nx * 6.5)
        if ny >= h3_y:
            t_blend = min(1.0, (ny - h3_y) * 15.0)
            r = r * (1 - t_blend) + hill3_c[0] * t_blend
            g = g * (1 - t_blend) + hill3_c[1] * t_blend
            b = b * (1 - t_blend) + hill3_c[2] * t_blend

        return r, g, b

    return pixel_fn

def render_cozy_art(width=600, height=450):
    """Renders a cozy lo-fi room / desk study atmosphere for the Cozy Visual Frame"""
    def pixel_fn(nx, ny, x, y, w, h):
        # Warm ambient room background with window and table
        # Top-left window light
        dx = nx - 0.35
        dy = ny - 0.35
        dist = math.sqrt(dx*dx + dy*dy)
        warmth = max(0.0, 1.0 - dist)

        # Base warm wood and cream tones
        r = 245 + warmth * 10 - ny * 35
        g = 225 + warmth * 15 - ny * 45
        b = 205 + warmth * 15 - ny * 50

        # Window frame area (nx: 0.15 - 0.55, ny: 0.15 - 0.55)
        if 0.15 <= nx <= 0.55 and 0.15 <= ny <= 0.55:
            # Soft blue-gold window glass
            r = 195 + (nx - 0.15) * 60
            g = 215 + (nx - 0.15) * 40
            b = 230 - (ny - 0.15) * 30
            # Window mullions
            if abs(nx - 0.35) < 0.015 or abs(ny - 0.35) < 0.015 or nx < 0.165 or nx > 0.535 or ny < 0.165 or ny > 0.535:
                r, g, b = 230, 215, 195

        # Wooden desk surface at bottom (ny > 0.65)
        if ny >= 0.65:
            desk_t = (ny - 0.65) / 0.35
            r = 180 - desk_t * 30
            g = 140 - desk_t * 25
            b = 110 - desk_t * 20

            # Cozy teacup on table (nx: 0.7 - 0.8, ny: 0.72 - 0.85)
            cup_dx = (nx - 0.75) * 4.0
            cup_dy = (ny - 0.78) * 3.5
            if cup_dx*cup_dx + cup_dy*cup_dy < 0.25:
                r, g, b = 245, 240, 235
                # Inside tea
                if cup_dx*cup_dx + cup_dy*cup_dy < 0.12 and ny < 0.79:
                    r, g, b = 160, 100, 65

        return r, g, b

    return pixel_fn

def main():
    os.makedirs('public/assets/banner', exist_ok=True)
    os.makedirs('public/assets/art', exist_ok=True)

    # 1. Banners
    themes = ['morning', 'sunset', 'night', 'sakura', 'forest', 'cloudy']
    for t in themes:
        ppm_path = f"/tmp/banner_{t}.ppm"
        if t == 'morning':
            webp_path = "public/assets/banner/default-banner.webp"
            webp_dash = "public/assets/banner/dashboard-banner.webp"
            png_path = "public/assets/banner/default-banner.png"
        else:
            webp_path = f"public/assets/banner/dashboard-banner-{t}.webp"
            webp_dash = None
            png_path = None

        print(f"Generating banner: {t}...")
        make_ppm(1280, 400, render_banner(t), ppm_path)
        subprocess.run(['convert', ppm_path, webp_path], check=True)
        if webp_dash:
            subprocess.run(['cp', webp_path, webp_dash], check=True)
        if png_path:
            subprocess.run(['convert', ppm_path, png_path], check=True)

    # 2. Cozy Art
    print("Generating cozy art...")
    art_ppm = "/tmp/cozy_art.ppm"
    make_ppm(600, 450, render_cozy_art(), art_ppm)
    subprocess.run(['convert', art_ppm, 'public/assets/art/cozy-art.webp'], check=True)
    subprocess.run(['convert', art_ppm, 'public/assets/art/cozy-art.png'], check=True)

    print("All assets generated successfully!")

if __name__ == '__main__':
    main()
