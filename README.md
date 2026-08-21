<h1 align="center">

👾  Multialcance WEB 👾
</h1>
<p align="center">🚀  Esse projeto tem como objetivo principal permitir que a clinica Multialcance cadastre, gerencie  e acompanhe usuários, pacientes e sessões.
</p>

### Pré-requisitos

Antes de começar, você vai precisar ter instalado em sua máquina as seguintes ferramentas:
[Git](https://git-scm.com/), [Node.js](https://nodejs.org/en/), ReactJs18, npm.
Além disto é bom ter um editor para trabalhar com o código como [VSCode](https://code.visualstudio.com/)

### 🎲 Rodando o Front

```
# Clone este repositório
$ git https://github.com/i-zzaa/heron-list-web.git

# Acesse a pasta do projeto no terminal/cmd
$ cd heron-list-we

# Instale as dependências 
$ npm install

# Execute a aplicação em modo de desenvolvimento
$ npm run dev

# O servidor inciará na porta:5173 - acesse <http://127.0.0.1:5173/>

```

### ⚙️ Configurações

É necessário criar um arquivo .env  na raiz do projeto com a variável de ambiente VITE_API_URL com a url do backend

.*env*

```
VITE_API_URL=http://localhost:3333
```

### ✅ Testes

Unitário (Vitest — funções puras de `util/`, `useBorderColorClass`, e
componentes simples via Testing Library):

```
npm test              # roda uma vez
npm run test:watch    # modo watch
npm run test:ui       # UI do Vitest no navegador
```

E2E (Playwright — sobe o próprio dev server numa porta separada e mocka
as chamadas de API, não depende de backend real disponível):

```
npx playwright install chromium   # só na primeira vez
npm run test:e2e
npm run test:e2e:ui   # modo UI, passo a passo
```

### 🛠 Tecnologias

As seguintes ferramentas foram usadas na construção do projeto:

- [ReactJs](https://react.dev/) 18
- [Vite](https://vitejs.dev/)
- [Axios](https://axios-http.com/ptbr/docs/intro)
- [Context API](https://legacy.reactjs.org/docs/context.html)
- [Eslint](https://eslint.org/)
- [Prettier](https://prettier.io/)
- [PrimeReact](https://primereact.org/)
