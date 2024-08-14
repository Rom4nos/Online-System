Sistema de Gerenciamento

Este projeto é um site para gerenciamento de sistema, desenvolvido com React Native e Firebase. O aplicativo permite gerenciar diversos aspectos do sistema e oferece funcionalidades de autenticação e armazenamento em nuvem.
Começando

Para começar com o projeto, siga estas instruções.
Pré-requisitos

Antes de começar, você precisará ter o Node.js e o npm (ou yarn) instalados. Você também precisará configurar o Firebase e adicionar suas credenciais ao projeto.
Instalando

    Clone o Repositório

    Clone o repositório para o seu ambiente local:

    bash

git clone <URL_DO_REPOSITORIO>
cd nome-do-repositorio

Instale as Dependências

Instale as dependências do projeto usando npm ou yarn:

bash

npm install
# ou
yarn install

Configurar Firebase

Para configurar o Firebase, você precisa adicionar suas credenciais do Firebase ao projeto. Crie um arquivo .env na raiz do projeto e adicione suas variáveis de ambiente do Firebase:

env

    REACT_APP_FIREBASE_API_KEY=your_api_key
    REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
    REACT_APP_FIREBASE_PROJECT_ID=your_project_id
    REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
    REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
    REACT_APP_FIREBASE_APP_ID=your_app_id

Scripts Disponíveis

No diretório do projeto, você pode executar:
npm start

Executa o aplicativo em modo de desenvolvimento.
Abra http://localhost:3000 para visualizá-lo no seu navegador.

A página será recarregada quando você fizer alterações.
Você também pode ver quaisquer erros de lint no console.
npm test

Executa o runner de testes em modo interativo.
Veja a seção sobre executar testes para mais informações.
npm run build

Cria o aplicativo para produção na pasta build.
Ele agrupa o React em modo de produção e otimiza a build para o melhor desempenho.

A build é minificada e os nomes dos arquivos incluem os hashes.
Seu aplicativo está pronto para ser implantado!

Veja a seção sobre implantação para mais informações.
npm run eject

Nota: esta é uma operação irreversível. Depois de eject, você não poderá voltar!

Se você não estiver satisfeito com as escolhas de ferramenta de build e configuração, você pode eject a qualquer momento. Este comando removerá a única dependência de build do seu projeto.

Em vez disso, ele copiará todos os arquivos de configuração e dependências transitivas (webpack, Babel, ESLint, etc.) diretamente para o seu projeto para que você tenha controle total sobre eles. Todos os comandos, exceto eject, ainda funcionarão, mas apontarão para os scripts copiados para que você possa ajustá-los. Neste ponto, você está por conta própria.

Você não precisa usar o eject. O conjunto de recursos curado é adequado para implantações pequenas e médias, e você não deve se sentir obrigado a usar esse recurso. No entanto, entendemos que essa ferramenta não seria útil se você não pudesse personalizá-la quando estiver pronto para isso.
Aprender Mais

Você pode aprender mais na documentação do React.

Para mais informações sobre o Firebase, consulte a documentação do Firebase.
Divisão de Código

Esta seção foi movida para: Divisão de Código
Análise do Tamanho do Pacote

Esta seção foi movida para: Análise do Tamanho do Pacote
Criando um Aplicativo Progressivo

Esta seção foi movida para: Criando um Aplicativo Progressivo
Configuração Avançada

Esta seção foi movida para: Configuração Avançada
npm run build Falha ao Minificar

Esta seção foi movida para: npm run build Falha ao Minificar
