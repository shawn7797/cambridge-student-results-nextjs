import React, { useState } from "react";

function Footer() {
  const [year, setYear] = useState(new Date().getFullYear());

  return (
    <footer className="border-t border-gray-200 bg-white py-6 text-center text-sm text-gray-500">
      <p>
        &copy; {year} Ideated and developed by{" "}
        <a
          href="https://www.linkedin.com/in/shawn7797"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-slate-700 hover:text-blue-600 transition-colors underline underline-offset-4"
        >
          Shawn Mathias
        </a>
        .
      </p>
    </footer>
  );
}

export default Footer;
