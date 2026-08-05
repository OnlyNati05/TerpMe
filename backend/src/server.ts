import app from "./api";
import { PORT } from "./api/config/env";

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
