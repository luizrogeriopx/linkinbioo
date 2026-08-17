# Plano de Correção de Responsividade Mobile

O usuário relatou que, apesar da correção anterior, o conteúdo ainda continua saindo da página (estouro horizontal) na versão mobile. Analisei o código e identifiquei possíveis culpados: elementos com largura fixa, mockups de dispositivos que podem não estar escalando corretamente e contêineres sem `max-width` adequado ou `overflow-hidden`.

## Alterações propostas

### Layout e Estilos Globais
- Adicionar `overflow-x-hidden` ao contêiner principal em `src/routes/index.tsx` para garantir que nada cause barra de rolagem lateral no corpo da página.
- Ajustar os contêineres de seções para garantir preenchimento consistente em telas pequenas.

### Hero Section (Landing Page)
- O mockup do Samsung Galaxy S8 (`w-[285px]`) pode estar causando problemas em dispositivos muito estreitos (ex: iPhone SE, 320px). Vou envolvê-lo em um contêiner que utilize `scale` ou `max-width: 100%` para garantir que ele caiba sempre.
- Ajustar o `h1` para usar `hyphens-auto` e garantir que palavras longas não quebrem o layout.
- Garantir que os botões de CTA tenham `w-full` em mobile (já feito, mas vou revisar se há conflitos com o grid pai).

### Seção de Métricas (Social Proof)
- Mudar de `grid-cols-2` para `grid-cols-1` em telas muito pequenas se os números grandes (`+50.000`) estiverem encavalando ou saindo da tela.

### Seção de Preços
- Revisar o padding e as margens dos cards de preço para evitar que toquem as bordas da tela.

### Painel Administrativo
- Reforçar a rolagem horizontal das abas e garantir que os cards de links/categorias não tenham margens negativas que causem estouro.

## Detalhes Técnicos
- Utilizar classes utilitárias do Tailwind: `w-full`, `max-w-full`, `overflow-hidden`, `break-words`.
- Garantir que `section` e `div` principais tenham `px-4` ou similar para evitar que o conteúdo encoste nas bordas físicas do aparelho.

## Validação
- Testar no preview em diferentes resoluções mobile (320px, 375px, 414px).
- Inspecionar elementos com `scrollWidth > clientWidth`.
