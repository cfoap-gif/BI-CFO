# Domain Map — Sistema de Boletim Interno do CFO
## 1. Visão Geral do Domínio
O Sistema de Boletim Interno do CFO deve ser organizado em domínios funcionais, cada um responsável por uma parte específica da rotina administrativa, acadêmica e documental do curso.
A regra principal do domínio é:
A rotina gera registros.
Os registros passam por validação.
A validação define o que será publicado.
A publicação gera o Boletim Interno em PDF.
O sistema não deve tratar o BI apenas como um formulário. Ele deve tratar o BI como resultado final de um fluxo documental.
## 2. Domínios Principais
O sistema será dividido nos seguintes domínios:
Cadastros Institucionais;
Planejamento do Curso;
Escalas e Serviços;
Livro de Dia;
Registros e Alterações;
Validação da Coordenação;
Publicação do Boletim Interno;
Geração de PDF;
Repositório Documental;
Segurança, Perfis e Auditoria.
## 3. Domínio 1 — Cadastros Institucionais
### 3.1 Finalidade
Manter a base de dados necessária para o funcionamento do sistema.
Esse domínio evita redigitação e permite que os demais módulos usem informações padronizadas.
### 3.2 Entidades principais
Aluno Oficial;
Pelotão;
Militar;
Instrutor;
Monitor;
Disciplina;
Local de instrução;
Viatura;
Material;
Tipo de uniforme;
Função de serviço;
Tipo de missão.
### 3.3 Responsabilidades
O domínio de Cadastros Institucionais deve permitir:
cadastrar alunos oficiais;
cadastrar pelotões;
cadastrar militares da coordenação;
cadastrar instrutores e monitores;
cadastrar disciplinas;
cadastrar locais de instrução;
cadastrar tipos de escala;
cadastrar materiais e equipamentos;
cadastrar viaturas;
cadastrar tipos de registros;
manter status ativo/inativo.
### 3.4 Regras
Aluno deve possuir número, nome completo, nome de guerra e pelotão.
Instrutor deve possuir posto/graduação, nome de guerra e identificação funcional.
Disciplina deve possuir nome, carga horária e tipo.
Registros históricos não devem ser apagados se já estiverem vinculados a BI, Livro de Dia, escala ou missão.
Cadastros devem poder ser desativados, não excluídos definitivamente.
## 4. Domínio 2 — Planejamento do Curso
### 4.1 Finalidade
Registrar o que está previsto para acontecer no curso.
Esse domínio representa o planejamento da Coordenação, especialmente QTS, atividades, instruções, eventos e rotinas.
### 4.2 Entidades principais
QTS;
Item de QTS;
Atividade prevista;
Instrução prevista;
Evento previsto;
Atividade complementar;
Plano de instrução;
Plano de segurança em instrução.
### 4.3 Responsabilidades
O domínio de Planejamento deve permitir:
cadastrar QTS por semana;
cadastrar atividade por data e horário;
vincular disciplina;
vincular instrutor;
vincular monitor;
vincular local;
indicar pelotão ou turma;
indicar uniforme;
indicar material previsto;
indicar carga horária prevista;
indicar se a atividade exige plano de segurança;
enviar atividades previstas para o Livro de Dia.
### 4.4 Regras
Uma atividade prevista deve ter data, horário inicial, horário final e responsável.
Uma instrução deve ter disciplina e instrutor.
Atividade prática pode exigir material, local específico e plano de segurança.
O QTS é a previsão; o Livro de Dia registra o que realmente ocorreu.
Alterações do QTS podem ser publicáveis no BI, se relevantes.
## 5. Domínio 3 — Escalas e Serviços
### 5.1 Finalidade
Gerenciar as escalas internas, acadêmico-militares e operacionais relacionadas ao CFO.
### 5.2 Entidades principais
Escala;
Item de escala;
Aluno de Dia ao Corpo de Alunos;
Aluno de Dia ao Pelotão;
Permanência;
Apoio interno;
Apoio à instrução;
Missão interna;
Missão externa;
Militar de serviço;
Permuta de serviço.
### 5.3 Responsabilidades
O domínio de Escalas e Serviços deve permitir:
criar escala por data;
escalar Aluno de Dia ao Corpo de Alunos;
escalar Aluno de Dia ao Pelotão;
escalar permanência;
escalar apoio interno;
escalar militares de apoio;
escalar alunos para missões;
registrar uniforme;
registrar horário de apresentação;
registrar local de apresentação;
registrar jornada;
controlar permutas autorizadas;
evitar conflitos de escala.
### 5.4 Regras
Uma escala deve ter data, função e pessoa escalada.
Um aluno não deve ser escalado em funções incompatíveis no mesmo horário.
Permuta de serviço deve ser autorizada pela Coordenação.
Escala publicada no BI deve estar validada.
Escalas podem alimentar automaticamente a 3ª Parte do BI.
Escala por período deve agrupar os itens por data.
## 6. Domínio 4 — Livro de Dia
### 6.1 Finalidade
Registrar a rotina real do dia, a partir do preenchimento feito pelo Aluno de Dia.
O Livro de Dia é a principal fonte operacional do BI, mas nem tudo que está no Livro de Dia será publicado.
### 6.2 Entidades principais
Livro de Dia;
Registro do Livro de Dia;
Efetivo diário;
Falta;
Atraso;
Baixa;
Dispensa;
Instrução realizada;
Alteração de material;
Ocorrência;
Passagem de serviço.
### 6.3 Responsabilidades
O domínio de Livro de Dia deve permitir:
abrir Livro de Dia por data;
puxar dados previstos do QTS;
puxar dados das escalas;
registrar efetivo previsto;
registrar efetivo presente;
registrar faltas;
registrar atrasos;
registrar baixas;
registrar dispensas;
registrar instruções ministradas;
registrar alterações de material;
registrar missões executadas;
registrar ocorrências relevantes;
registrar observações;
registrar passagem de serviço;
enviar Livro de Dia para revisão da Coordenação.
### 6.4 Regras
Só deve existir um Livro de Dia principal por data e por turma/curso.
O Aluno de Dia pode preencher o Livro de Dia, mas não aprova a publicação.
O Livro de Dia enviado não deve ser alterado livremente sem reabrir ou devolver para correção.
Todo registro do Livro de Dia deve ter tipo, data, descrição e responsável.
O sistema deve sugerir se um registro é publicável, interno ou restrito.
A decisão final de publicação é da Coordenação.
## 7. Domínio 5 — Registros e Alterações
### 7.1 Finalidade
Organizar todos os fatos registrados no sistema, independentemente de sua origem.
Esse domínio funciona como uma central de alterações.
### 7.2 Tipos de registros
Alteração de pessoal;
Falta;
Atraso;
Baixa;
Dispensa;
Apresentação;
Reapresentação;
Alteração de material;
Alteração de instrução;
Alteração de escala;
Missão;
Ocorrência disciplinar;
Elogio;
Recompensa;
Aviso;
Prescrição da Coordenação.
### 7.3 Classificação dos registros
Todo registro deverá ser classificado como:
Publicável;
Interno;
Restrito.
### 7.4 Status dos registros
Todo registro deverá ter status:
Rascunho;
Enviado;
Em revisão;
Pendente de correção;
Validado;
Incluído no BI;
Interno;
Restrito;
Cancelado;
Arquivado.
### 7.5 Responsabilidades
O domínio de Registros e Alterações deve permitir:
criar registros manuais;
receber registros do Livro de Dia;
receber registros de escalas;
receber registros do QTS;
classificar registros;
encaminhar registros para validação;
manter histórico do registro;
vincular registro a um BI publicado.
### 7.6 Regras
Registro sem validação não entra no PDF.
Registro restrito não deve aparecer no PDF.
Registro interno fica no sistema, mas não é publicado.
Registro publicável só entra no BI após aprovação.
Registro cancelado não entra no BI.
Registro incluído em BI deve manter vínculo com o documento publicado.
## 8. Domínio 6 — Validação da Coordenação
### 8.1 Finalidade
Garantir que somente informações corretas, relevantes e autorizadas entrem no Boletim Interno.
Esse domínio é o filtro administrativo do sistema.
### 8.2 Entidades principais
Fila de validação;
Parecer da Coordenação;
Decisão de publicação;
Solicitação de correção;
Histórico de revisão;
Validador;
Aprovador.
### 8.3 Responsabilidades
O domínio de Validação deve permitir:
visualizar registros pendentes;
filtrar por data;
filtrar por tipo;
filtrar por pelotão;
filtrar por aluno;
corrigir texto;
devolver para ajuste;
marcar como publicável;
marcar como interno;
marcar como restrito;
validar registro;
cancelar registro;
registrar observação da Coordenação;
aprovar inclusão no BI.
### 8.4 Regras
Apenas a Coordenação ou perfil autorizado pode validar registros.
Validação deve registrar usuário, data e hora.
Devolução para correção deve conter motivo.
Registros sensíveis devem ser marcados como restritos.
A Coordenação pode editar o texto final que será publicado.
A validação não apaga o texto original; deve preservar histórico.
## 9. Domínio 7 — Publicação do Boletim Interno
### 9.1 Finalidade
Montar o Boletim Interno a partir dos registros validados.
Este domínio transforma dados em documento.
### 9.2 Entidades principais
Boletim Interno;
Item do Boletim;
Parte do Boletim;
Número do BI;
Período do BI;
Versão;
Status do BI.
### 9.3 Partes do BI
O BI será composto por:
1ª Parte — Legislação, Organização e Ensino;
2ª Parte — Alteração de Pessoal;
3ª Parte — Assuntos Gerais e Administrativos;
4ª Parte — Justiça, Disciplina e Comportamento Escolar;
5ª Parte — Comunicação Social, Avisos e Prescrições Diversas.
### 9.4 Status do BI
O BI deverá possuir os seguintes status:
Rascunho;
Em preenchimento;
Aguardando revisão;
Revisado;
Aprovado;
PDF gerado;
Publicado;
Arquivado;
Substituído;
Cancelado.
### 9.5 Responsabilidades
O domínio de Publicação deve permitir:
criar BI;
definir número;
definir ano;
definir data de publicação;
definir data inicial;
definir data final;
identificar se é diário ou por período;
buscar registros validados;
separar registros por parte;
organizar itens por data;
montar prévia;
permitir edição final;
aprovar publicação;
gerar itens definitivos do BI.
### 9.6 Regras
O número do BI deve ser único por ano.
Um BI pode abranger um ou mais dias.
Se o período tiver um dia, o BI é diário.
Se o período tiver mais de um dia, o BI é por período.
Registros pendentes não entram na prévia.
Registros internos não entram na prévia.
Registros restritos não entram na prévia.
Parte sem item deve exibir “Sem alteração”.
BI aprovado não pode ser editado livremente.
Alteração após aprovação deve gerar nova versão ou retificação.
## 10. Domínio 8 — Geração de PDF
### 10.1 Finalidade
Gerar o arquivo final do Boletim Interno em PDF, com padrão moderno, formal, limpo e publicável.
### 10.2 Entidades principais
Template de PDF;
Arquivo PDF;
Versão do PDF;
Código de verificação;
Rodapé;
Metadados do documento.
### 10.3 Responsabilidades
O domínio de PDF deve permitir:
gerar prévia visual;
aplicar template institucional;
renderizar cabeçalho;
renderizar partes do BI;
renderizar tabelas;
renderizar campo de aprovação;
renderizar rodapé;
gerar arquivo PDF;
salvar arquivo;
permitir download;
registrar data/hora de geração;
gerar código de verificação.
### 10.4 Regras
PDF só deve ser gerado após aprovação da prévia.
PDF deve usar os dados congelados do BI aprovado.
Alterações posteriores não devem modificar automaticamente PDF já gerado.
Nova versão deve gerar novo arquivo.
O arquivo deve ter nome padronizado.
O PDF deve ser armazenado no repositório documental.
### 10.5 Nome padrão do arquivo
Formato recomendado:
BI_CFO_2026_N000_DD-MM-AAAA.pdf
Exemplo:
BI_CFO_2026_N005_02-06-2026.pdf
Para período:
BI_CFO_2026_N006_01-06-2026_a_03-06-2026.pdf
## 11. Domínio 9 — Repositório Documental
### 11.1 Finalidade
Guardar, consultar e recuperar Boletins Internos publicados.
### 11.2 Entidades principais
Documento publicado;
Arquivo PDF;
Histórico de versões;
Retificação;
Código de verificação;
Metadados de publicação.
### 11.3 Responsabilidades
O domínio de Repositório deve permitir:
listar BIs;
buscar por número;
buscar por data;
buscar por período;
buscar por aluno;
buscar por missão;
buscar por tipo de registro;
visualizar PDF;
baixar PDF;
consultar versão;
consultar status;
marcar BI como substituído;
registrar retificação.
### 11.4 Regras
BI publicado deve ficar arquivado.
BI substituído deve continuar acessível.
Retificação deve indicar qual documento foi retificado.
O sistema deve manter histórico de geração.
Usuários de consulta só visualizam documentos autorizados.
## 12. Domínio 10 — Segurança, Perfis e Auditoria
### 12.1 Finalidade
Controlar acesso, proteger informações sensíveis e manter rastreabilidade das ações.
### 12.2 Perfis principais
Administrador;
Coordenação do CFO;
Coordenador de Pelotão;
Aluno de Dia ao Corpo de Alunos;
Aluno de Dia ao Pelotão;
Instrutor;
Consulta.
### 12.3 Responsabilidades
O domínio de Segurança deve permitir:
autenticar usuários;
controlar permissões;
limitar acesso por perfil;
proteger registros restritos;
registrar alterações;
registrar validações;
registrar geração de PDF;
registrar download, se necessário;
manter trilha de auditoria.
### 12.4 Regras
Aluno de Dia não aprova publicação.
Instrutor só confirma informações da própria instrução, salvo permissão maior.
Coordenador de Pelotão só acessa registros do seu pelotão, salvo autorização.
Coordenação tem acesso à validação e publicação.
Registros restritos exigem permissão específica.
Toda validação deve registrar usuário, data e hora.
Toda geração de PDF deve registrar usuário, data, hora e versão.
## 13. Relação entre Domínios
### 13.1 Fluxo principal
Cadastros Institucionais
→ Planejamento do Curso
→ Escalas e Serviços
→ Livro de Dia
→ Registros e Alterações
→ Validação da Coordenação
→ Publicação do BI
→ Geração de PDF
→ Repositório Documental
### 13.2 Fluxo alternativo
A Coordenação pode criar registros diretamente em Registros e Alterações, sem passar pelo Livro de Dia.
Exemplo:
ordem da Coordenação;
aviso oficial;
punição escolar;
elogio;
alteração de QTS;
missão determinada.
### 13.3 Fluxo de instrução
QTS prevê a instrução.
Instrutor confirma a execução.
Livro de Dia registra alterações.
Coordenação valida.
BI publica somente se relevante.
### 13.4 Fluxo de escala
Coordenação cria escala.
Aluno executa serviço.
Livro de Dia registra alterações.
Coordenação valida.
BI publica escala ou alteração relevante.
### 13.5 Fluxo de falta
Aluno de Dia registra falta.
Registro fica pendente.
Coordenação verifica justificativa.
Coordenação valida.
Sistema define se entra no BI.
PDF publica apenas o resumo necessário.
## 14. Bounded Contexts Recomendados
Para desenvolvimento, o sistema pode ser separado em bounded contexts:
### 14.1 Identity & Access
Responsável por usuários, perfis e permissões.
### 14.2 Academic Planning
Responsável por QTS, disciplinas, instrutores e atividades previstas.
### 14.3 Duty & Scales
Responsável por escalas, serviços e missões.
### 14.4 Daily Book
Responsável pelo Livro de Dia e registros de rotina.
### 14.5 Records & Review
Responsável por alterações, classificação, validação e revisão.
### 14.6 Bulletin Publishing
Responsável por criação do BI, prévia, partes, itens e status.
### 14.7 Document Generation
Responsável por template, PDF, armazenamento e versionamento.
### 14.8 Archive & Search
Responsável por repositório, consulta e busca histórica.
## 15. Agregados Principais
### 15.1 Bulletin
Agregado responsável pelo Boletim Interno.
Contém:
número;
ano;
período;
status;
itens;
versão;
aprovação;
PDF.
### 15.2 DailyBook
Agregado responsável pelo Livro de Dia.
Contém:
data;
aluno de dia;
efetivo;
registros;
status;
envio;
validação.
### 15.3 Record
Agregado responsável por qualquer alteração lançada.
Contém:
tipo;
origem;
data;
descrição;
classificação;
status;
validação;
decisão de publicação.
### 15.4 DutyScale
Agregado responsável por escalas.
Contém:
data;
tipo;
função;
pessoa escalada;
horário;
local;
status.
### 15.5 Mission
Agregado responsável por missões.
Contém:
tipo;
período;
local;
responsável;
efetivo;
viatura;
resultado;
status.
### 15.6 PdfDocument
Agregado responsável pelo arquivo final.
Contém:
bulletin_id;
versão;
arquivo;
código de verificação;
data de geração;
gerado por.
## 16. Eventos de Domínio
Eventos úteis para o sistema:
LivroDeDiaCriado;
LivroDeDiaEnviado;
RegistroCriado;
RegistroEnviadoParaValidacao;
RegistroValidado;
RegistroMarcadoComoPublicavel;
RegistroMarcadoComoInterno;
RegistroMarcadoComoRestrito;
EscalaCriada;
MissaoCadastrada;
BoletimCriado;
PreviaDoBoletimGerada;
BoletimAprovado;
PdfGerado;
BoletimPublicado;
BoletimRetificado;
BoletimArquivado.
## 17. Linguagem Ubíqua
Termos que devem ser usados de forma padronizada no sistema:
Boletim Interno;
BI;
Livro de Dia;
Aluno de Dia ao Corpo de Alunos;
Aluno de Dia ao Pelotão;
Coordenação;
QTS;
Escala;
Serviço Diário;
Alteração de Pessoal;
Alteração de Material;
Instrução Ministrada;
Missão Interna;
Missão Externa;
Registro Publicável;
Registro Interno;
Registro Restrito;
Validação;
Prévia do BI;
PDF Final;
Retificação;
Arquivamento.
## 18. MVP por Domínio
Para o MVP, os domínios prioritários são:
Cadastros Institucionais;
Escalas e Serviços;
Livro de Dia;
Registros e Alterações;
Validação da Coordenação;
Publicação do BI;
Geração de PDF.
O QTS completo, repositório avançado, QR Code, assinatura eletrônica e busca inteligente podem ficar para fases futuras.
## 19. Decisão Arquitetural Inicial
O sistema deve ser construído de forma modular, mas sem complexidade excessiva no MVP.
Recomendação:
manter domínios separados no código;
usar componentes reutilizáveis;
evitar acoplamento direto entre Livro de Dia e PDF;
fazer o PDF depender apenas dos itens aprovados do BI;
manter histórico de alterações;
preservar os registros originais.
A regra técnica principal será:
O PDF nunca deve ser gerado diretamente do Livro de Dia.
O PDF deve ser gerado a partir dos itens aprovados do Boletim Interno.
## 20. Resumo Executivo do Mapa de Domínio
O BI-CFO terá como núcleo os registros da rotina acadêmico-militar.
O Livro de Dia registra o que aconteceu.
As escalas registram quem estava designado.
O QTS registra o que estava previsto.
A Coordenação valida o que é relevante.
O Boletim Interno organiza o que será publicado.
O PDF formaliza o documento final.
O Repositório preserva o histórico.
Essa separação garante segurança, rastreabilidade, clareza e facilidade de evolução futura.