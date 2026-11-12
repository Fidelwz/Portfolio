"use client";

import { useState } from "react";

/**
 * La locomotora D51 del programa `sl` de Toyoda Masashi, que castiga
 * a quien escribe mal `ls` haciendo pasar un tren por la terminal.
 */
const D51 = String.raw`      ====        ________                ___________
  _D _|  |_______/        \__I_I_____===__|_________|
   |(_)---  |   H\________/ |   |        =|___ ___|
   /     |  |   H  |  |     |   |         ||_| |_||
  |      |  |   H  |__--------------------| [___] |
  | ________|___H__/__|_____/[][]~\_______|       |
  |/ |   |-----------I_____I [][] []  D   |=======|__
__/ =| o |=-~~\  /~~\  /~~\  /~~\ ____Y___________|__
 |/-=|___|=    ||    ||    ||    |_____/~\___/
  \_/      \O=====O=====O=====O_/      \_/`;

export function Train() {
  const [passed, setPassed] = useState(false);

  if (passed) {
    return (
      <p className="text-dim" aria-hidden="true">
        ·  ·  · el tren ya pasó ·  ·  ·
      </p>
    );
  }

  return (
    <div className="overflow-hidden [container-type:inline-size]" role="img" aria-label="Un tren de vapor cruza la terminal">
      <pre
        className="w-max text-[10px] leading-[1.15] text-muted motion-safe:animate-train sm:text-[11px]"
        onAnimationEnd={() => setPassed(true)}
      >
        {D51}
      </pre>
    </div>
  );
}
