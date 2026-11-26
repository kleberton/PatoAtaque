# 🦆 Pato Ataque

Jogo de tiro ao alvo feito em JavaScript puro. Controle uma mira com o mouse e acerte os patos coloridos que saem de trás dos arbustos na beira do lago!

## Como jogar

1. Abra o arquivo `index.html` no navegador (dois cliques bastam, não precisa instalar nada).
2. Mova o **mouse** para controlar a mira.
3. **Clique** para atirar nos patos antes que eles escapem.

### Controles

| Ação | Controle |
| --- | --- |
| Mirar | Mover o mouse |
| Atirar | Clique esquerdo |
| Recarregar | Tecla `R` (ou automático quando a munição acaba) |
| Jogar de novo | Clique na tela de fim de jogo |

### Regras

- Você tem **6 tiros** por carga.
- Você começa com **5 vidas**. Cada pato que escapa pela borda da tela tira uma vida.
- Patos menores (e mais difíceis) valem mais pontos.
- Quanto mais pontos, mais rápidos e frequentes ficam os patos.
- O **recorde** fica salvo no navegador.

Os patos aparecem em 10 cores: amarelo, marrom, branco, rosa, azul, verde, roxo, vermelho, laranja e preto.

## Arquivos

- `index.html`: página que carrega o jogo.
- `game.js`: toda a lógica e o desenho do jogo (canvas 2D).

## Personalizando

- Para mudar ou adicionar cores de pato, edite a lista `DUCK_COLORS` no início de `game.js`.
- Para ajustar a dificuldade, altere `lives`, `ammo` e a função `spawnDuck`.
