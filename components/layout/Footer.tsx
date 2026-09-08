import React from "react";

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/80 backdrop-blur py-4 px-4 sm:px-6 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <p className="text-slate-400">
          &copy; {new Date().getFullYear()} <span className="text-slate-300 font-medium">Rohit Kagdewad Lending</span>. All rights reserved.
        </p>
        <p className="text-slate-400">
          Developed by{" "}
          <a
            href="https://www.yugvextechsolutions.site/"
            target="_self"
            className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2 transition-colors"
          >
            Yugvex Tech Solutions
          </a>
          , Pune. Contact No &ndash;{" "}
          <a
            href="tel:7219290885"
            className="text-slate-300 hover:text-white font-medium transition-colors"
          >
            7219290885
          </a>
        </p>
      </div>
    </footer>
  );
}
