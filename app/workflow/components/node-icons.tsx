import type { NodeType } from "../types";

export function renderNodeIcon(type?: NodeType): React.ReactNode {
  const iconProps = { xmlns: "http://www.w3.org/2000/svg", width: 20, height: 20, fill: "none", viewBox: "0 0 20 20" };

  const icons: Record<NodeType, React.ReactNode> = {
    start: (
      <svg {...iconProps}>
        <rect width="20" height="20" fill="#13b982" rx="5"></rect>
        <circle cx="9.999" cy="10" r="5.2" fill="#fff" stroke="#fff" strokeWidth="1.3"></circle>
        <path fill="#13b982" d="m9.31 7.498 3.15 2.182a.39.39 0 0 1 0 .642L9.31 12.5a.39.39 0 0 1-.612-.32V7.819c0-.314.353-.5.612-.32"></path>
      </svg>
    ),
    end: (
      <svg {...iconProps}>
        <rect width="20" height="20" fill="#fa423c" rx="5"></rect>
        <circle cx="10" cy="10" r="5.15" stroke="#fff" strokeWidth="1.4"></circle>
        <circle cx="10" cy="10" r="1.95" fill="#fff"></circle>
      </svg>
    ),
    llm: (
      <svg {...iconProps}>
        <rect width="20" height="20" fill="#352eff" rx="5"></rect>
        <path fill="#fff" d="M14.841 7.23a.645.645 0 0 0-.352-.868l-3.956-1.774a1.32 1.32 0 0 0-1.068 0L5.51 6.362a.67.67 0 0 0-.35.331.645.645 0 0 0 .35.868l4.163 1.857c.1.05.213.08.328.08a.8.8 0 0 0 .329-.08l4.162-1.856a.68.68 0 0 0 .35-.333M9.23 9.999 5.476 8.331a.69.69 0 0 0-.648 0 .67.67 0 0 0-.352.581v4.26c0 .26.149.496.383.607l3.76 1.671q.145.072.307.074a.72.72 0 0 0 .587-.34.7.7 0 0 0 .097-.338V10.58a.69.69 0 0 0-.38-.58m6.294 3.173v-4.26a.68.68 0 0 0-.352-.58.68.68 0 0 0-.636-.017L10.757 10a.68.68 0 0 0-.367.582v4.278a.69.69 0 0 0 .35.582.7.7 0 0 0 .334.083.65.65 0 0 0 .306-.073l3.776-1.672a.67.67 0 0 0 .368-.607"></path>
      </svg>
    ),
    intention: (
      <svg {...iconProps}>
        <rect width="20" height="20" fill="#f97316" rx="5"></rect>
        <path fill="#fff" d="M7.95 6.5c.534-.755 1.967-.755 2.5 0l.534.755 1.05-.087c.928-.077 1.559.86 1.132 1.705l-.349.696.632.59c.703.657.302 1.835-.657 1.959l-.853.11-.23.827c-.203.73-1.21 1.025-1.788.535l-.663-.555-.663.555c-.578.49-1.585.195-1.788-.535l-.23-.827-.853-.11c-.959-.124-1.36-1.302-.657-1.96l.632-.588-.349-.697c-.427-.844.204-1.782 1.132-1.705l1.05.087z"/>
      </svg>
    ),
    service_http: (
      <svg {...iconProps}>
        <rect width="20" height="20" fill="#29ccc9" rx="5"></rect>
        <path fill="#fff" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="m13.755 9.422-.866.867L9.71 7.111l.867-.866c.433-.434 2.022-1.156 3.177 0s.434 2.744 0 3.177"></path>
        <path stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="m15.2 4.8-1.445 1.445"></path>
        <path fill="#fff" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="m6.244 10.578.867-.867 3.178 3.178-.867.867c-.433.433-2.022 1.155-3.178 0-1.155-1.156-.433-2.745 0-3.178"></path>
        <path stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="m9.71 12.311 1.156-1.155M4.8 15.2l1.444-1.444m1.444-3.467 1.156-1.156"></path>
      </svg>
    ),
    api: (
      <svg {...iconProps}>
        <rect width="20" height="20" fill="#29ccc9" rx="5"></rect>
        <path fill="#fff" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="m13.755 9.422-.866.867L9.71 7.111l.867-.866c.433-.434 2.022-1.156 3.177 0s.434 2.744 0 3.177"></path>
        <path stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="m15.2 4.8-1.445 1.445"></path>
        <path fill="#fff" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="m6.244 10.578.867-.867 3.178 3.178-.867.867c-.433.433-2.022 1.155-3.178 0-1.155-1.156-.433-2.745 0-3.178"></path>
        <path stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="m9.71 12.311 1.156-1.155M4.8 15.2l1.444-1.444m1.444-3.467 1.156-1.156"></path>
      </svg>
    ),
    chat: (
      <svg {...iconProps}>
        <rect width="20" height="20" fill="#f471b5" rx="5"></rect>
        <path fill="#fff" d="M6.5 6.5h7a1 1 0 0 1 1 1v3.75a1 1 0 0 1-1 1h-1.9l-1.52 1.52a.5.5 0 0 1-.848-.353V12.25H6.5a1 1 0 0 1-1-1V7.5a1 1 0 0 1 1-1"/>
      </svg>
    ),
    message: (
      <svg {...iconProps}>
        <rect width="20" height="20" fill="#fb7185" rx="5"></rect>
        <path fill="#fff" d="M6.5 6h7a1 1 0 0 1 1 1v4.5a1 1 0 0 1-1 1h-2l-1.7 1.7a.5.5 0 0 1-.854-.353V12.5h-2.5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1"/>
      </svg>
    ),
    loop: (
      <svg {...iconProps}>
        <rect width="20" height="20" fill="#f97316" rx="5"></rect>
        <path fill="#fff" d="M6.5 6.5h5.25V5l2.75 2.25-2.75 2.25v-1.5H7.5c-.552 0-1 .448-1 1v2h-1v-2c0-1.105.895-2 2-2m7.5 4v2c0 1.105-.895 2-2 2H6.75V16L4 13.75 6.75 11.5V13h4.25c.552 0 1-.448 1-1v-2h1z"/>
      </svg>
    ),
    code: (
      <svg {...iconProps}>
        <rect width="20" height="20" fill="#f97316" rx="5"></rect>
        <path fill="#fff" d="M8.5 6.5a.5.5 0 0 1 .83-.37l2.5 2.25a.5.5 0 0 1 0 .74l-2.5 2.25a.5.5 0 0 1-.83-.37z"/>
        <path fill="#fff" d="M7.5 7.25a.5.5 0 0 0-.83-.37L4.17 9.13a.5.5 0 0 0 0 .74l2.5 2.25a.5.5 0 0 0 .83-.37z"/>
        <rect width="2" height="10" x="13" y="5" fill="#fff" rx="0.5"></rect>
      </svg>
    ),
    branch: (
      <svg {...iconProps}>
        <rect width="20" height="20" fill="#f97316" rx="5"></rect>
        <path fill="#fff" d="M6.5 5.5c0-.552.448-1 1-1h1.5c.552 0 1 .448 1 1v2.115c0 .414.336.75.75.75h1.252c.69 0 1.248.559 1.248 1.248v.774c0 .414-.336.75-.75.75h-.75a.75.75 0 0 0-.75.75v2.563c0 .552-.448 1-1 1H7.5c-.552 0-1-.448-1-1z"/>
      </svg>
    ),
    switch: (
      <svg {...iconProps}>
        <rect width="20" height="20" fill="#f97316" rx="5"></rect>
        <path fill="#fff" d="M6.5 5.5c0-.552.448-1 1-1h1.5c.552 0 1 .448 1 1v2.115c0 .414.336.75.75.75h1.252c.69 0 1.248.559 1.248 1.248v.774c0 .414-.336.75-.75.75h-.75a.75.75 0 0 0-.75.75v2.563c0 .552-.448 1-1 1H7.5c-.552 0-1-.448-1-1z"/>
      </svg>
    ),
    workflow: (
      <svg {...iconProps}>
        <rect width="20" height="20" fill="#4F46E5" rx="5"></rect>
        <path fill="#fff" d="M6.5 5.5a1 1 0 0 1 1-1h2.75a1 1 0 0 1 1 1v1.25h1.25a1 1 0 0 1 1 1v2.25a1 1 0 0 1-1 1H11.25V14a1 1 0 0 1-1 1H7.5a1 1 0 0 1-1-1z"/>
      </svg>
    ),
  };

  return icons[type] || null;
}
