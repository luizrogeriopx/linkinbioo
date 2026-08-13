# LinkBio

# Prompt para o Lovable: Página "Link na Bio" Profissional

Crie uma aplicação web moderna, responsiva e otimizada para dispositivos móveis, semelhante ao Linktree, com foco em alta conversão para Instagram.

## Objetivo

Permitir que eu cadastre links organizados por categorias para divulgar produtos de afiliado, redes sociais, conteúdos e ofertas.

## Design

* Visual premium e minimalista.
* Fundo em degradê moderno (preto, cinza e azul escuro).
* Cartões com efeito glassmorphism.
* Botões grandes com cantos arredondados.
* Animações suaves ao passar o mouse.
* Totalmente responsivo.
* Excelente experiência em celulares.

## Cabeçalho

Exibir:

* Foto de perfil circular.
* Nome.
* @usuário.
* Pequena descrição.
* Ícones das redes sociais.

## Categorias

Criar categorias expansíveis (accordion), como:

* 🔥 Ofertas
* 💰 Renda Extra
* 📚 Cursos
* 🤖 Inteligência Artificial
* 🎁 Ferramentas
* 📱 Redes Sociais
* 🎥 Vídeos
* 🌐 Sites Úteis

Cada categoria pode conter vários links.

## Links

Cada link deve possuir:

* Ícone
* Título
* Descrição opcional
* URL
* Cor personalizada (opcional)
* Botão ocupando toda a largura
* Abertura em nova aba

## Área Administrativa

Criar um painel protegido por login onde seja possível:

* Adicionar categorias.
* Editar categorias.
* Excluir categorias.
* Alterar ordem das categorias por arrastar e soltar.
* Adicionar links.
* Editar links.
* Excluir links.
* Alterar ordem dos links.
* Ativar ou desativar links.
* Pesquisar links.
* Duplicar links rapidamente.

## Recursos Extras

Implementar:

* Campo de busca para localizar links.
* Contador de cliques por link.
* Link em destaque fixado no topo.
* Links favoritos.
* Modo claro e escuro.
* Compartilhamento de links.
* Botão "Voltar ao topo".
* Animações suaves.
* Lazy Loading.
* SEO otimizado.
* Open Graph para compartilhamento.
* Favicon personalizado.

## Banco de Dados

Utilizar Supabase.

Criar tabelas para:

* Usuários
* Categorias
* Links
* Estatísticas de cliques

Utilizar autenticação do Supabase.

## Tecnologias

* React
* TypeScript
* Vite
* Tailwind CSS
* shadcn/ui
* Lucide Icons
* Supabase
* React Router
* React Query
* Framer Motion

## Painel

Criar dashboard com:

* Total de cliques.
* Links mais acessados.
* Cliques por dia.
* Cliques por categoria.
* Total de links.
* Total de categorias.

## Funcionalidades Avançadas

* QR Code para compartilhar a página.
* Importar e exportar links em JSON.
* Backup automático.
* Copiar link com um clique.
* Upload de imagem para categorias.
* Upload de favicon.
* Upload de foto de perfil.
* Banner promocional opcional.
* Link patrocinado em destaque.
* Sistema preparado para múltiplos usuários.

## Performance

* Carregamento rápido.
* Componentes reutilizáveis.
* Código organizado.
* Boas práticas de React.
* Estrutura escalável.
* Acessibilidade (WCAG).
* Lighthouse acima de 95.

## Resultado esperado

Gerar uma aplicação pronta para produção, com aparência profissional, semelhante ao Linktree, porém muito mais completa, elegante e fácil de administrar, permitindo gerenciar dezenas ou centenas de links organizados por categorias para uso na bio do Instagram.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://luizrogeriopaixao.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/687887d6-00bf-4eee-aa30-32bffd4fa32e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
