// Entry point: this is the only file that binds a port.
import "dotenv/config";
import { app } from "./app";
import { prisma } from "./lib/prisma";

const port = Number(process.env.PORT ?? 3000);

// Connect to the database BEFORE accepting requests. Prisma otherwise
// connects lazily on the first query — so a broken/unreachable DB would
// surface as a 500 on some visitor's first request instead of a loud,
// obvious failure right here at startup.
prisma
  .$connect()
  .then(() => {
    app.listen(port, () => {
      console.log(`Mech Assemble API listening on http://localhost:${port}`);
    });
  })
  .catch((e) => {
    console.error("Failed to connect to the database:", e);
    process.exit(1);
  });
