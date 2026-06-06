import { httpRouter } from "convex/server";
import { recordAndRedirect } from "./redirect";

const http = httpRouter();

http.route({
  path: "/recordAndRedirect",
  method: "POST",
  handler: recordAndRedirect,
});

export default http;
