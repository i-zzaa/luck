* Tela Login 
  ** campo login
    - o nome precisa ser nome.sobrenome
    - aceita apenas letras
  ** campo senha 
    - minimo de 8 digitos 
    - aceita apenas números
  ** checkbox lembrar login
    - salva seu logn e senha no localstorage da máquina. Se apagar o storage do navegador, os dados serão apagados
  ** botão Entrar 
    - valida se o login e senha estão corretos e efetua o login
    - Senha/Login errado, deve exibir mensagem de erro e não alterar a tela

* Tela Home
  ** texto com nome completo do usuário logado
  ** login do usuário logado
  ** campo alterar senha 
    - altera a senha do usuário logado


* Tela PEI

* Tela Protocolo 
  ** campo paciente 
    - campo de selecao do paciente
  ** campo protocolo
    - campo de selecao do protocolo [Portage/PEI/VB Mapp]

    *** Portage 
      **** botao de visualizao/exportar pdf com o relatório do portage realizado
      **** exbibe lista com grupos de [Socializacao/Cognicacao], com categorias de faixa etárias [0-1/1-2/2-3/3-4/4-5/5-6], cada categoria tem um conjunto de atividades 
      onde o usuario deverá clicar no checkbox [S(1)/AV(0.5)/N(0)] e marcar se o paciente executa ou não aquela atividades.
      **** botao de salvar portage
        - cada vez que salvar, o sistema salvará outro registro (não irá sobrescrever o atual), mas só carregará na lista o último salvo.
        - os itens marcados como 'S', não serão apresentados na tela de Metas (Agenda > Botão Metas)

    *** PEI
    *** VB Mapp


* Tela Agenda

* Tela Primeira Resposta