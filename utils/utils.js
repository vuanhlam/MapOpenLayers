export function addInteractions() {
  draw = new Draw({
    source: source,
    type: typeSelect.value,
  });
  // console.log(draw);
  map.addInteraction(draw);
  console.log(typeSelect.value);
  snap = new Snap({ source: source });
  map.addInteraction(snap);
}
