import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextVitals,
  {
    ignores: ["public/pdf.worker.min.mjs", "node_modules/**"],
  },
];

export default eslintConfig;
