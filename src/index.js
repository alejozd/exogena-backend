const app = require("./app");

app.listen(app.PORT, () => {
  console.log(`Servidor Exógena Backend corriendo en http://localhost:${app.PORT}`);
});
