import React, { useState } from "react";

function Footer() {
  const [year, setYear] = useState(new Date().getFullYear())

  return (
    <footer className="border-t border-gray-200 bg-white py-6 text-center text-sm text-gray-500">
      <p>&copy; {year} Ideated and developed by Shawn Mathias.</p>
    </footer>
  );
}

export default Footer;
