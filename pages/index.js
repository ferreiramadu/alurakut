import { React, useState, useEffect } from 'react'

import nookies from 'nookies';
import jwt from 'jsonwebtoken';

import MainGrid from '../src/components/MainGrid';
import Box from '../src/components/Box';
import { AlurakutMenu, AlurakutProfileSidebarMenuDefault, OrkutNostalgicIconSet } from '../src/lib/AluraCommons'
import { ProfileRelationsBoxWrapper } from '../src/components/profileRelations'

function ProfileSidebar(propriedades) {
  return (
    <Box as="aside" className="profileArea" style={{ gridArea: "profileArea" }}>
      <img style={{ borderRadius: "8px" }} src={`https://github.com/${propriedades.githubUser}.png`} />
      <hr />

      <p>
        <a className="boxLink" href={`https://github.com/${propriedades.githubUser}`}>@{propriedades.githubUser}</a>
      </p>
      <hr />

      <AlurakutProfileSidebarMenuDefault />
    </Box>
  )
}

function ProfileRelationsBox(propriedades) {
  return (
    <ProfileRelationsBoxWrapper>
      <h2 className="smallTitle">
        {propriedades.title} ({propriedades.items.length})
      </h2>
      <ul>
        {/*
          seguidores.map((itemAtual) => {
            return (
              <li key={itemAtual}>
                <a href={`/users/${itemAtual}`}>
                  <img src={`https://github.com/${itemAtual}.png`} />
                  <span>{itemAtual.title}</span>
                </a>
              </li>
            )
          })
        */}
      </ul>
    </ProfileRelationsBoxWrapper>
  )
}

export default function Home(props) {
  const [comunidades, setComunidades] = useState([{ id: '01010110101010101', title: 'Eu odeio acordar cedo', image: 'https://alurakut.vercel.app/capa-comunidade-01.jpg' }]);
  const githubUser = props.githubUser;
  const pessoasFavoritas = ['juunegreiros', 'omariosouto', 'peas', 'rafaballerini', 'marcobrunodev', 'felipefialho']

  const [seguidores, setSeguidores] = useState([]);
  useEffect(function () {
    fetch('https://api.github.com/users/peas/followers')
      .then(function (respostaDoServidor) {
        return respostaDoServidor.json();
      }).then(function (respostaCompleta) {
        setSeguidores(respostaCompleta)
      })

    //API DO DATO CMS
    fetch('https://graphql.datocms.com', {
      method: 'POST',
      headers: {
        'Authorization': '58e0e23a35087824396f90c47b4f56',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        "query": `query {
        allComunities {
          id
          title
          imageUrl
          _status
          creatorSlug
        }
      }` })
    })
      .then((response) => response.json())
      .then((respostaCompleta) => {
        const comunidadesVindasDoDato = respostaCompleta.data.allComunities
        setComunidades(comunidadesVindasDoDato)
      })
  }, [])

  return (
    <>
      <AlurakutMenu githubUser={githubUser} />
      <MainGrid>
        <div>
          <ProfileSidebar githubUser={githubUser} />
        </div>
        <div>
          <Box className="welcomeArea" style={{ gridArea: "welcomeArea" }}>
            <h1>Bem vindo (a)</h1>
            <OrkutNostalgicIconSet />
          </Box>
          <Box>
            <h2 className="subTitle">O que você deseja fazer?</h2>
            <form onSubmit={function handleSubmit(e) {
              e.preventDefault(); //previnindo reload na tela
              const dataForm = new FormData(e.target); //pegando os dados do input do formulario

              //variavel chamada no fetch como body para o post
              const comunidade = {
                title: dataForm.get('title'),
                imageUrl: dataForm.get('image'),
                creatorSlug: githubUser
              }

              //fetch para o dato api/comunidades
              fetch('/api/comunidades', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(comunidade)
              })
              .then(async (response) => {
                const dados = await response.json();
                console.log(dados.registroCriado);
                const comunidade = dados.registroCriado;
                const comunidadesAtualizadas = [...comunidades, comunidade];
                setComunidades(comunidadesAtualizadas)
              })
            }}>
              <div>
                <input
                  placeholder="Qual vai ser o nome da sua comunidade?"
                  name="title"
                  aria-label="Qual vai ser o nome da sua comunidade?"
                  type="text"
                />
              </div>
              <div>
                <input
                  placeholder="Coloque uma URL para usarmos de capa"
                  name="image"
                  aria-label="Coloque uma URL para usarmos de capa"
                  type="text"
                />
              </div>
              <button>Criar comunidade</button>
            </form>
          </Box>
        </div>
        <div className="profileRelationsArea" style={{ gridArea: "profileRelationsArea" }}>

          <ProfileRelationsBox title="Seguidores" items={seguidores} />

          <ProfileRelationsBoxWrapper>
            <h2 className="smallTitle">
              Meus amigos ({pessoasFavoritas.length})
            </h2>
            <ul>
              {
                pessoasFavoritas.map((itemAtual) => {
                  return (
                    <li key={itemAtual}>
                      <a href={`/users/${itemAtual}`}>
                        <img src={`https://github.com/${itemAtual}.png`} />
                        <span>{itemAtual}</span>
                      </a>
                    </li>
                  )
                })
              }
            </ul>
          </ProfileRelationsBoxWrapper>

          <ProfileRelationsBoxWrapper>
            <h2 className="smallTitle">
              Minhas comunidades ({comunidades.length})
            </h2>

            {
              <ul>
                {
                  comunidades.map((itemAtual) => {
                    return (
                      <li key={itemAtual.creatorSlug}>
                        <a href={`/users/${itemAtual.title}`}>
                          <img src={itemAtual.imageUrl} />
                          <span>{itemAtual.title}</span>
                        </a>
                      </li>
                    )
                  })
                }
              </ul>
            }
          </ProfileRelationsBoxWrapper>
        </div>
      </MainGrid>
    </>
  )
}

export async function getServerSideProps(context) {
  const cookies = nookies.get(context)
  const token = cookies.USER_TOKEN;
  const { isAuthenticated } = await fetch('https://alurakut.vercel.app/api/auth', {
    headers: {
        Authorization: token
      }
  })
  .then((resposta) => resposta.json())

  if(!isAuthenticated) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      }
    }
  }

  const { githubUser } = jwt.decode(token);
  return {
    props: {
      githubUser
    }, // will be passed to the page component as props
  }
}