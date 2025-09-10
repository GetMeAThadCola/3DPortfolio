// src/lib/color.js
// Ensures Three gets a 3/6 digit hex (no alpha). If you want transparency,
// pass transparent/opacity on the material instead.
export function hex6(color) {
  if (typeof color !== "string") return color;
  if (!color.startsWith("#")) return color;
  // #RRGGBBAA -> #RRGGBB, #RGBA -> #RGB
  if (color.length === 9 || color.length === 5) {
    return "#" + color.slice(1, color.length - (color.length === 9 ? 2 : 1));
  }
  return color;
}
