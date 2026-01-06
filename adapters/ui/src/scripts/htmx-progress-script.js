htmx.on("form", "htmx:xhr:progress", function handler(evt) {
  const field = htmx.find("#progress");
  field.style.display = "block";

  const value = (evt.detail.loaded / evt.detail.total) * 100;
  if (value === 100) {
    htmx.find(field, "span").textContent = "Processing files...";
    htmx.find(field, "progress").style.display = "none";
  } else {
    htmx.find(field, "span").textContent = `Uploading: ${value.toFixed(2)}%`;
    htmx.find(field, "progress").setAttribute("value", value);
  }
});
