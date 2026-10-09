import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

interface VehicleSvgDefinition {
  id: string;
  name: string;
  svg: string;
}

// Low-poly vehicles defined with isometric faceted geometry, high-contrast roof/body, Zaldi Z, no baked shadow
export const VEHICLE_SVGS: VehicleSvgDefinition[] = [
  // 1. LOW-POLY ELECTRIC BIKE (ZALDI MOTO)
  {
    id: 'bike',
    name: 'Zaldi Moto EV',
    svg: `<svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Low-Poly Front Wheel (Octagonal faceted tire & rim) -->
  <polygon points="345,335 390,305 405,255 385,215 340,240 325,290" fill="#0f172a" />
  <polygon points="345,335 325,290 340,240 365,275" fill="#1e293b" />
  <polygon points="355,305 380,290 390,260 375,245 350,265" fill="#38bdf8" />
  <polygon points="355,305 350,265 365,275" fill="#0284c7" />

  <!-- Low-Poly Rear Wheel -->
  <polygon points="125,370 170,340 185,290 165,250 120,275 105,325" fill="#0f172a" />
  <polygon points="125,370 105,325 120,275 145,310" fill="#1e293b" />
  <polygon points="135,340 160,325 170,295 155,280 130,300" fill="#38bdf8" />

  <!-- Low-Poly Swingarm & Chain Drive Frame -->
  <polygon points="155,305 240,295 235,330 145,335" fill="#1e293b" />
  <polygon points="155,305 235,330 215,345 135,340" fill="#0f172a" />

  <!-- Low-Poly Main Frame Spine -->
  <polygon points="220,310 320,230 335,245 230,335" fill="#334155" />
  <polygon points="230,335 335,245 315,265 210,345" fill="#1e293b" />

  <!-- High-Contrast Body Battery & Cowl (Electric Cyan) -->
  <polygon points="215,270 295,200 325,235 240,305" fill="#06b6d4" />
  <polygon points="215,270 240,305 230,330 205,290" fill="#0891b2" />
  <polygon points="255,190 295,200 320,175 275,165" fill="#22d3ee" />

  <!-- ZALDI 'Z' EMBLEM on Battery Tank (Faceted Neon Gold) -->
  <polygon points="245,230 280,210 270,225 255,225" fill="#facc15" />
  <polygon points="270,225 255,225 275,250 250,265" fill="#eab308" />
  <polygon points="250,265 275,250 290,240 265,255" fill="#facc15" />

  <!-- Rider Seat & Tail Cowl (Dark Contrast) -->
  <polygon points="160,250 220,245 215,275 155,275" fill="#0f172a" />
  <polygon points="160,250 155,275 140,270 145,245" fill="#1e293b" />

  <!-- Front Fork & Handlebars -->
  <polygon points="325,185 365,275 355,285 315,195" fill="#475569" />
  <polygon points="310,165 335,175 320,195 295,185" fill="#64748b" />
  <polygon points="290,165 350,150 355,160 295,175" fill="#0f172a" />

  <!-- Headlight Cowl & Visor (Cyan + Ice Glow) -->
  <polygon points="340,165 385,180 375,215 330,195" fill="#22d3ee" />
  <polygon points="360,185 385,180 375,215" fill="#f8fafc" />
</svg>`
  },

  // 2. LOW-POLY AUTO RICKSHAW 3W (ZALDI TUKTUK)
  {
    id: 'auto',
    name: 'Zaldi TukTuk 3W',
    svg: `<svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Front Wheel (Faceted) -->
  <polygon points="370,360 410,335 420,290 395,260 360,285 350,330" fill="#0f172a" />
  <polygon points="370,360 350,330 360,285 380,310" fill="#1e293b" />
  <polygon points="375,330 395,315 400,295 385,285 370,300" fill="#facc15" />

  <!-- Rear Left Wheel -->
  <polygon points="110,380 150,355 160,315 140,285 100,310 90,350" fill="#0f172a" />
  <polygon points="110,380 90,350 100,310 120,335" fill="#1e293b" />
  <polygon points="115,350 135,335 140,315 125,305 110,320" fill="#15803d" />

  <!-- Lower Body Tub / Chassis (Rich Emerald Green) -->
  <polygon points="120,330 250,345 360,315 390,265 260,280 145,290" fill="#15803d" />
  <polygon points="120,330 145,290 130,265 105,300" fill="#166534" />
  <polygon points="250,345 360,315 350,295 245,320" fill="#14532d" />

  <!-- Front Tapered Nose / Bonnet (Canary & Emerald Facets) -->
  <polygon points="360,315 425,270 390,230 330,265" fill="#16a34a" />
  <polygon points="390,230 425,270 415,250 380,215" fill="#eab308" />
  <!-- Front Headlight (Faceted Amber Glow) -->
  <polygon points="410,260 435,245 425,235 400,250" fill="#fef08a" />

  <!-- Windshield (Low-Poly Glass Facets) -->
  <polygon points="330,265 390,230 360,170 300,195" fill="#38bdf8" fill-opacity="0.9" />
  <polygon points="330,265 300,195 275,205 305,275" fill="#7dd3fc" fill-opacity="0.85" />

  <!-- Cabin Pillars -->
  <polygon points="150,270 160,270 160,190 150,190" fill="#1e293b" />
  <polygon points="265,260 275,260 270,185 260,185" fill="#1e293b" />

  <!-- HIGH-CONTRAST ROOF CANOPY (Bright Canary Yellow Top & Sides) -->
  <!-- Roof Side Flank (Golden Amber) -->
  <polygon points="145,195 295,190 355,165 340,150 280,170 135,175" fill="#eab308" />
  <!-- Roof Top Plane (Vibrant Canary Yellow) -->
  <polygon points="135,175 280,170 340,150 260,130 110,150" fill="#facc15" />
  <polygon points="340,150 355,165 305,145 260,130" fill="#fde047" />

  <!-- ZALDI 'Z' EMBLEM on the Yellow Roof (High Contrast Slate) -->
  <polygon points="195,158 245,147 235,153 210,158" fill="#0f172a" />
  <polygon points="235,153 210,158 230,165 200,171" fill="#0284c7" />
  <polygon points="200,171 230,165 250,161 220,166" fill="#0f172a" />
</svg>`
  },

  // 3. LOW-POLY CITY SEDAN (ZALDI GO)
  {
    id: 'sedan',
    name: 'Zaldi Go Sedan',
    svg: `<svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Front Wheel (Faceted Low-Poly) -->
  <polygon points="360,365 405,335 415,285 390,250 345,280 335,330" fill="#0f172a" />
  <polygon points="360,365 335,330 345,280 370,310" fill="#1e293b" />
  <polygon points="365,335 390,320 395,295 380,280 360,300" fill="#fde047" />

  <!-- Rear Wheel (Faceted Low-Poly) -->
  <polygon points="140,385 185,355 195,305 170,270 125,300 115,350" fill="#0f172a" />
  <polygon points="140,385 115,350 125,300 150,330" fill="#1e293b" />
  <polygon points="145,355 170,340 175,315 160,300 140,320" fill="#fde047" />

  <!-- Lower Body / Chassis (Deep Royal Cobalt Blue) -->
  <polygon points="110,340 240,355 350,340 435,285 330,280 180,290 85,310" fill="#1e3a8a" />
  <polygon points="110,340 85,310 95,275 130,295" fill="#172554" />
  <polygon points="240,355 350,340 435,285 415,265 245,315" fill="#1d4ed8" />

  <!-- Front Wedge Hood (Deep Cobalt Facets) -->
  <polygon points="330,280 435,285 415,245 320,240" fill="#2563eb" />
  <polygon points="415,245 435,285 450,265 425,235" fill="#1d4ed8" />
  <!-- Dual Angular Headlights -->
  <polygon points="425,260 445,250 435,240 415,250" fill="#ffffff" />

  <!-- Rear Trunk Deck -->
  <polygon points="95,275 175,285 160,250 85,255" fill="#1e3a8a" />
  <polygon points="85,255 160,250 145,235 75,245" fill="#172554" />

  <!-- Cabin Windows (Faceted Glass) -->
  <polygon points="160,250 320,240 290,185 185,195" fill="#38bdf8" fill-opacity="0.9" />
  <polygon points="320,240 375,235 345,185 290,185" fill="#93c5fd" fill-opacity="0.85" />
  <polygon points="160,250 185,195 145,205 130,255" fill="#0284c7" />

  <!-- HIGH-CONTRAST ROOF (Vibrant Solar Yellow Top Plane) -->
  <!-- Roof Side Edge -->
  <polygon points="175,195 335,185 345,175 185,185" fill="#eab308" />
  <!-- Roof Top Surface (Solar Yellow) -->
  <polygon points="185,185 345,175 305,150 155,160" fill="#fde047" />

  <!-- ZALDI 'Z' EMBLEM on the Roof (High Contrast Slate) -->
  <polygon points="215,175 265,167 255,172 230,175" fill="#0f172a" />
  <polygon points="255,172 230,175 250,181 220,186" fill="#0284c7" />
  <polygon points="220,186 250,181 270,178 240,183" fill="#0f172a" />
</svg>`
  },

  // 4. LOW-POLY RUGGED SUV (ZALDI PRIME SUV)
  {
    id: 'suv',
    name: 'Zaldi Prime SUV',
    svg: `<svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Front Wheel (Large Faceted Low-Poly) -->
  <polygon points="360,375 415,340 425,280 395,240 340,275 330,335" fill="#0f172a" />
  <polygon points="360,375 330,335 340,275 370,305" fill="#1e293b" />
  <polygon points="365,340 395,320 405,290 385,270 360,295" fill="#c084fc" />

  <!-- Rear Wheel (Large Faceted Low-Poly) -->
  <polygon points="135,395 190,360 200,300 170,260 115,295 105,355" fill="#0f172a" />
  <polygon points="135,395 105,355 115,295 145,325" fill="#1e293b" />
  <polygon points="140,360 170,340 180,310 160,290 135,315" fill="#c084fc" />

  <!-- Chunky Wheel Arches (Matte Black) -->
  <polygon points="325,325 345,265 410,255 425,295" fill="#0f172a" />
  <polygon points="100,345 120,285 185,275 200,315" fill="#0f172a" />

  <!-- Lower Body / Chassis (Deep Midnight Purple) -->
  <polygon points="105,335 240,355 350,335 440,285 330,270 190,280 80,300" fill="#1e1b4b" />
  <polygon points="240,355 350,335 440,285 415,260 235,305" fill="#2e1065" />
  <!-- Front Skid Plate (Silver) -->
  <polygon points="410,300 445,285 435,265 400,280" fill="#cbd5e1" />

  <!-- Front Muscular Hood (Faceted Purple) -->
  <polygon points="330,270 440,285 415,235 315,225" fill="#581c87" />
  <polygon points="415,235 440,285 455,260 425,225" fill="#3b0764" />
  <!-- Grille & Headlights -->
  <polygon points="425,250 450,240 440,230 415,240" fill="#facc15" />

  <!-- Boxy Tall Greenhouse Cabin (Faceted Glass) -->
  <polygon points="150,250 315,225 285,160 170,175" fill="#38bdf8" fill-opacity="0.9" />
  <polygon points="315,225 375,220 345,160 285,160" fill="#93c5fd" fill-opacity="0.85" />
  <polygon points="150,250 170,175 130,190 115,260" fill="#0284c7" />

  <!-- HIGH-CONTRAST FLAT ROOF & ROOF RAILS (Radiant Lavender/Silver) -->
  <!-- Roof Flank -->
  <polygon points="160,175 335,160 345,148 170,163" fill="#a855f7" />
  <!-- Roof Top Surface (Radiant Lavender) -->
  <polygon points="170,163 345,148 300,125 135,140" fill="#c084fc" />
  <!-- Roof Rack Rails (Electric Cyan Accent) -->
  <polygon points="180,150 320,138 322,143 182,155" fill="#38bdf8" />

  <!-- ZALDI 'Z' EMBLEM on the SUV Roof (Vivid Neon Gold) -->
  <polygon points="205,152 255,144 245,149 220,153" fill="#facc15" />
  <polygon points="245,149 220,153 240,158 210,164" fill="#eab308" />
  <polygon points="210,164 240,158 260,154 230,160" fill="#facc15" />
</svg>`
  },

  // 5. LOW-POLY CARGO TRUCK (ZALDI HAUL)
  {
    id: 'truck',
    name: 'Zaldi Haul Mini-Truck',
    svg: `<svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Front Steering Wheel -->
  <polygon points="375,370 420,335 430,280 400,245 355,275 345,330" fill="#0f172a" />
  <polygon points="375,370 345,330 355,275 385,305" fill="#1e293b" />
  <polygon points="380,340 405,320 410,290 395,270 375,295" fill="#6366f1" />

  <!-- Dual Rear Wheels (Axle 1 & 2) -->
  <polygon points="190,385 235,350 245,295 215,260 170,290 160,345" fill="#0f172a" />
  <polygon points="190,385 160,345 170,290 200,320" fill="#1e293b" />
  <polygon points="195,355 220,335 225,305 210,285 190,310" fill="#6366f1" />

  <polygon points="110,395 155,360 165,305 135,270 90,300 80,355" fill="#0f172a" />
  <polygon points="110,395 80,355 90,300 120,330" fill="#1e293b" />
  <polygon points="115,365 140,345 145,315 130,295 110,320" fill="#6366f1" />

  <!-- Chassis Frame Rail -->
  <polygon points="70,350 250,360 360,340 370,310 80,315" fill="#0f172a" />

  <!-- Front Cab-Over Cabin (Deep Indigo) -->
  <polygon points="330,340 445,320 455,235 340,245" fill="#312e81" />
  <polygon points="445,320 465,300 460,215 455,235" fill="#1e1b4b" />
  <!-- Cab Windshield & Windows -->
  <polygon points="350,240 445,230 425,175 355,185" fill="#38bdf8" fill-opacity="0.9" />
  <polygon points="445,230 458,215 438,165 425,175" fill="#93c5fd" fill-opacity="0.85" />
  <polygon points="355,185 425,175 410,160 350,170" fill="#4338ca" />

  <!-- HIGH-CONTRAST RECTANGULAR CARGO FREIGHT BOX (Bright White & Silver) -->
  <!-- Cargo Box Flank (Bright Pearl White) -->
  <polygon points="85,315 330,305 325,145 80,165" fill="#f8fafc" />
  <polygon points="85,315 80,165 65,180 70,330" fill="#cbd5e1" />
  <!-- Cargo Box Top Surface (Pure Clean White) -->
  <polygon points="80,165 325,145 275,115 50,135" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" />

  <!-- BOLD ZALDI 'Z' GRAPHIC ACROSS CARGO BOX (Golden Amber on White Box) -->
  <polygon points="135,270 275,250 255,265 175,275" fill="#facc15" />
  <polygon points="255,265 175,275 235,185 155,195" fill="#eab308" />
  <polygon points="235,185 155,195 285,175 205,185" fill="#facc15" />
</svg>`
  },

  // 6. LOW-POLY PARCEL COURIER SCOOTER (ZALDI EXPRESS)
  {
    id: 'parcel',
    name: 'Zaldi Express Courier',
    svg: `<svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Front Wheel -->
  <polygon points="350,345 390,315 400,270 380,235 340,260 330,305" fill="#0f172a" />
  <polygon points="350,345 330,305 340,260 365,290" fill="#1e293b" />
  <polygon points="355,315 375,300 380,280 370,265 350,285" fill="#34d399" />

  <!-- Rear Wheel -->
  <polygon points="140,375 180,345 190,300 170,265 130,290 120,335" fill="#0f172a" />
  <polygon points="140,375 120,335 130,290 155,320" fill="#1e293b" />
  <polygon points="145,345 165,330 170,310 160,295 140,315" fill="#34d399" />

  <!-- Step-Through Floorboard & Frame (Deep Teal) -->
  <polygon points="175,340 335,325 325,305 165,315" fill="#064e3b" />
  <!-- Front Apron & Steering Column -->
  <polygon points="295,315 365,245 350,215 280,285" fill="#047857" />
  <polygon points="350,215 365,245 380,230 365,200" fill="#065f46" />
  <!-- Handlebars -->
  <polygon points="330,185 385,175 390,185 335,195" fill="#0f172a" />

  <!-- Rider Seat (Dark Slate) -->
  <polygon points="180,275 255,265 245,290 175,295" fill="#0f172a" />

  <!-- HIGH-CONTRAST PARCEL DELIVERY CUBE (Fluorescent Mint & Emerald) -->
  <!-- Delivery Cube Flank (Mint Green) -->
  <polygon points="110,295 210,280 200,165 100,180" fill="#10b981" />
  <polygon points="110,295 100,180 85,195 90,310" fill="#059669" />
  <!-- Delivery Cube Top Plane (Bright Lime Mint) -->
  <polygon points="100,180 200,165 165,135 75,150" fill="#34d399" />

  <!-- VIVID ZALDI 'Z' EMBLEM on the Parcel Cube (Neon Golden Amber) -->
  <polygon points="115,255 185,245 175,252 135,258" fill="#facc15" />
  <polygon points="175,252 135,258 170,200 130,205" fill="#eab308" />
  <polygon points="170,200 130,205 190,195 150,202" fill="#facc15" />
</svg>`
  }
];

async function generateAll() {
  const imagesDir = './src/assets/images';
  const publicDir = './public/vehicles';

  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  console.log('Generating low-poly assets for all vehicles...');

  for (const item of VEHICLE_SVGS) {
    const svgPath = path.join(imagesDir, `zaldi_${item.id}_lowpoly.svg`);
    const publicSvgPath = path.join(publicDir, `zaldi_${item.id}_lowpoly.svg`);
    fs.writeFileSync(svgPath, item.svg);
    fs.writeFileSync(publicSvgPath, item.svg);

    // Rasterize 512x512 transparent PNG (No ground, no baked shadow, 100% transparent cutout)
    const pngBuffer512 = await sharp(Buffer.from(item.svg))
      .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    const pngPath512 = path.join(imagesDir, `zaldi_${item.id}_lowpoly.png`);
    const publicPngPath512 = path.join(publicDir, `zaldi_${item.id}_lowpoly.png`);
    fs.writeFileSync(pngPath512, pngBuffer512);
    fs.writeFileSync(publicPngPath512, pngBuffer512);

    // Also write a 64x64 crisp silhouette version for ultra-fast map rendering
    const pngBuffer64 = await sharp(Buffer.from(item.svg))
      .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    const pngPath64 = path.join(imagesDir, `zaldi_${item.id}_lowpoly_64.png`);
    const publicPngPath64 = path.join(publicDir, `zaldi_${item.id}_lowpoly_64.png`);
    fs.writeFileSync(pngPath64, pngBuffer64);
    fs.writeFileSync(publicPngPath64, pngBuffer64);

    console.log(`✓ Generated ${item.id}: SVG + 512px PNG + 64px PNG`);
  }

  console.log('\nAll vehicle SVG and PNG assets successfully generated!');
}

generateAll().catch(console.error);
