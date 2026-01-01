import { createRouter } from "./app/router";

const root = document.getElementById("app");
if (!root) throw new Error("#app not found");

const router = createRouter(root);
router.go("start");
