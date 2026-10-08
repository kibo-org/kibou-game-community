import { execFileSync } from "node:child_process";

const metadata = execFileSync("git", ["log", "--all", "--format=%ae%n%ce"], { encoding: "utf8" });
const emails = metadata.split("\n").filter(Boolean);
const permitted = (email) => /^[^\s@]+@users\.noreply\.github\.com$/i.test(email)
  || email === "noreply@github.com";
if (!emails.length || emails.some(email => !permitted(email))) {
  throw new Error("Public commit history requires GitHub noreply author and committer addresses. Configure your public identity and amend affected commits before submitting; do not print personal emails in CI.");
}
console.log("Public author metadata check passed: GitHub noreply identities only.");
