import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import { dirname } from "path";
import { fileURLToPath } from "url";

const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, {
  rules: {
    // TypeScript rules
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-non-null-assertion": "warn",
    "@typescript-eslint/ban-ts-comment": "warn",
    
    // React rules
    "react-hooks/exhaustive-deps": "warn",
    "react/no-unescaped-entities": "warn",
    "react/display-name": "warn",
    "react/prop-types": "warn",
    
    // Next.js rules
    "@next/next/no-img-element": "warn",
    "@next/next/no-html-link-for-pages": "warn",
    
    // General JavaScript rules - improved
    "prefer-const": "warn",
    "no-unused-vars": "warn",
    "no-empty": "warn",
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
  },
}, {
  ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts", "examples/**", "skills", ".zscripts/**", "db/**", "download/**"]
}];

export default eslintConfig;
