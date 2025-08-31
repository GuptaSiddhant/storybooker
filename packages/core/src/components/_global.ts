// oxlint-disable max-lines
// oxlint-disable no-useless-escape
export function globalStyleSheet(): string {
  return /*css*/ `
    :root {
      --color-bg-base: #f2f2f2;
      --color-bg-card: #ffffff;
      --color-bg-invert: #000000;
      --color-text-primary: #09090b;
      --color-text-secondary: #71717b;
      --color-text-accent: #2b7fff;
      --color-text-invert: #ffffff;
      --color-border: #e4e4e7;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --color-bg-base: #09090b;
        --color-bg-card: #18181b;
        --color-bg-invert: #ffffff;
        --color-text-primary: #fafafa;
        --color-text-secondary: #9f9fa9;
        --color-text-accent: #2b7fff;
        --color-text-invert: #000000;
        --color-border: #ffffff1a;
      }
    }

    * {
      box-sizing: border-box;
      color-scheme: light dark;
      font-family: system-ui;      
      border-color: var(--color-border);
      border-radius: 0px;
    }

    body {
      font-size: 1rem;
      padding: 0;
      margin: 0px;
      min-height: 100vh;
      background-color: var(--color-bg-base);
      color: var(--color-text-secondary);     
    }
    
    #app {
      font-size: 1rem;
      padding: 0.5rem;
      margin: 0px;
      display: grid;      
      gap: 0.5rem;
      min-height: 100vh;
      overflow-y: auto;
      overflow-x: hidden;
      background-color: var(--color-bg-base);
      color: var(--color-text-secondary);
      grid-template-areas: "logo header" "aside main" "user footer";
      grid-template-rows: max-content 1fr max-content;
      grid-template-columns: max-content 1fr;
    }

    #logo {      
      grid-area: logo;
      display: flex;
      justify-content: center;
      align-items: center;      
      padding: 0 1rem;
      min-height: 3.5rem;
    }

    #app > * {      
      background-color: var(--color-bg-card);
      color: var(--color-text-primary);      
      overflow: hidden;     
      border: 1px solid var(--color-border);
    }

    #app > header {
      grid-area: header;           
      display: flex;
      align-items: center;      
      gap: 1rem;
      padding: 0 1rem;
      min-height: 3.5rem;
    }

    #app > aside {
      grid-area: aside;
      width: 200px;   
      padding: 1rem;
    }
    #app > #user {
      grid-area: user;
      width: 200px;      
    }

    @media screen and (max-width: 600px) {
      #app {
        display: flex;
        flex-direction: column;
      }
      #logo {
        display: none;
      }
      #app > aside {
        width: 100%;
      }
    }



    #app > main {
      grid-area: main;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      overflow: auto;
      padding: 1rem;     
    }

    #app > footer {
      grid-area: footer;    
      padding: 1rem;  
      min-height: 3rem;
    }

    hr {
      color: var(--color-border);
      background: var(--color-border);
      border-color: var(--color-border);
    }

    table {      
      height: 100%;
      width: 100%;      
      overflow: hidden;
      border-collapse: collapse;
    }

    table caption {
      font-weight: bold;
      font-size: 1.25rem;
      padding: 0.5rem 1rem;            
      text-align: start;
    }

    thead {
      background-color: var(--color-bg-base);
      color: var(--color-text-secondary);
    }    

    th {
      color: var(--color-text-secondary);
      font-weight: medium;
      font-size: 0.9rem;
      text-align: start;
      padding: 0.5rem 1rem;
    }

    tbody>tr:hover {
      background-color: var(--color-border);
    }

    td {
      text-align: start;
      height: max-content;
      padding: 1rem;
      color: var(--color-text-primary);
    }

    time {
      font-family: monospace;
      font-size: 0.9rem;
      color: var(--color-text-secondary);
    }

    a,
    a:visited {
      color: var(--color-text-accent);
      text-decoration: none;
    }
    a:hover {
      color: var(--color-text-accent);
      text-decoration: underline;
    }

    .raw-data {
      margin: 0;
      background-color: #00000010;
      border: 1px solid var(--color-border);      
      font-family: monospace;
      font-size: 0.9rem;
      white-space: pre-wrap;
      padding: 0.5rem;
      overflow: auto;
    }
    .raw-data:empty{
      display: none;
    }
      
    .page-heading {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-weight: bold;
    }

    .page-heading > ul {
      display: flex;
      align-items: center;
      padding: 0;
      margin: 0;
      list-style: none;
    }
    .page-heading > ul > li {      
      font-weight: normal;
      list-style: none;
      font-size: 0.9em;
    }
    .page-heading > ul > li::after {      
      content: \"/\";
      color: inherit;
      margin: 0 0.5rem;
      opacity: 0.5;
    }

    .description {
      color: var(--color-text-secondary);
      font-size: 0.9rem;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    form fieldset {
      display: flex;
      flex-direction:column;
      gap: 1rem;      
      padding: 1rem;
    }
    
    form legend {
      font-size:0.9rem;
    }

    form .field {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    form label {
      font-size: 0.8rem;
      font-weight: 600;
    }
   
    input,
    select {
      min-height: 3em;
    }

    input,
    select,
    textarea
    {      
      padding: 0.25rem 0.5rem;
      color: inherit;      
      border: 1px solid var(--color-border);
    }
    
    button, a.button {
      padding: 0.25rem 0.5rem;
      cursor: pointer;
      font-size: 0.9em;      
    }

    button[type="submit"] {
      background-color: var(--color-bg-invert);
      color: var(--color-text-invert);      
      padding: 0.25rem 1rem;
    }

    .description {
      font-size: 0.8rem;
      color: var(--color-text-secondary);
    }

    a.button {
      border: 1px solid var(--color-border);
      background: none;
      display: flex;
      align-items: center;
      justify-content: center;
      color: inherit;
    }
    a.button:hover {
      text-decoration:none;
    }

    button.destructive {
      background: #f002;
    }
  `.replaceAll(/\s+/g, " ");
}
