# User Stories e Critérios de Aceite — Sistema de Boletim Interno do CFO
## 1. Objetivo deste Documento
Este documento descreve as principais histórias de usuário e critérios de aceite para desenvolvimento do MVP do Sistema de Boletim Interno do CFO.
O foco do MVP é permitir o fluxo completo:
Cadastro básico → Livro de Dia → Validação da Coordenação → Prévia do BI → Geração de PDF → Arquivamento.
## 2. Perfis Considerados
### Administrador
Usuário com acesso total ao sistema, responsável por configurações gerais, perfis e cadastros estruturais.
### Coordenação do CFO
Usuário responsável pela validação dos registros, decisão do que entra no BI, aprovação da prévia e geração do PDF.
### Coordenador de Pelotão
Usuário que pode revisar informações relacionadas ao seu pelotão, conforme permissão definida pela Coordenação.
### Aluno de Dia ao Corpo de Alunos
Usuário responsável por preencher o Livro de Dia geral, consolidando informações do Corpo de Alunos.
### Aluno de Dia ao Pelotão
Usuário responsável por registrar informações do respectivo pelotão.
### Instrutor
Usuário que pode confirmar instruções ministradas, carga horária, faltas e alterações relacionadas à sua atividade.
### Consulta
Usuário que pode apenas visualizar Boletins Internos publicados, conforme permissão.
## 3. Épico 1 — Cadastros Institucionais
### US-001 — Cadastrar aluno oficial
Como Coordenação, quero cadastrar alunos oficiais para que eles possam ser utilizados nas escalas, registros do Livro de Dia, faltas, alterações e publicações do BI.
#### Critérios de aceite
Deve ser possível cadastrar número do aluno, nome completo, nome de guerra, pelotão, matrícula e situação.
O número do aluno deve ser único dentro da turma.
O nome de guerra deve ser obrigatório.
O pelotão deve ser obrigatório.
O aluno deve poder ser marcado como ativo ou inativo.
Aluno já vinculado a registro, escala ou BI não deve ser excluído definitivamente; apenas desativado.
O sistema deve permitir editar dados cadastrais, mantendo histórico mínimo de alteração.
### US-002 — Cadastrar militar, instrutor ou monitor
Como Coordenação, quero cadastrar militares, instrutores e monitores para vinculá-los a instruções, escalas, missões e funções administrativas.
#### Critérios de aceite
Deve ser possível cadastrar posto/graduação, nome completo, nome de guerra, matrícula, função e contato.
Deve ser possível marcar o cadastro como instrutor, monitor, coordenação ou apoio.
Deve ser possível ativar ou desativar o cadastro.
O sistema deve permitir vincular um instrutor a uma disciplina.
Militar já usado em registro histórico não deve ser excluído definitivamente.
### US-003 — Cadastrar disciplina
Como Coordenação, quero cadastrar disciplinas do CFO para associá-las ao QTS, às instruções ministradas e aos registros do Livro de Dia.
#### Critérios de aceite
Deve ser possível cadastrar nome da disciplina, ano do CFO, carga horária, tipo e instrutor principal.
O tipo da disciplina deve permitir ao menos: teórica, prática ou mista.
A disciplina deve poder ser ativada ou desativada.
A disciplina deve poder ser vinculada a registros de instrução ministrada.
O sistema deve impedir disciplina sem nome.
### US-004 — Cadastrar locais de instrução
Como Coordenação, quero cadastrar locais de instrução para padronizar o preenchimento de QTS, escalas, missões e Livro de Dia.
#### Critérios de aceite
Deve ser possível cadastrar nome do local, descrição e status.
O local deve poder ser utilizado em instruções, missões e escalas.
O sistema deve permitir campo livre quando o local ainda não estiver cadastrado.
Locais desativados não devem aparecer como opção padrão em novos registros.
## 4. Épico 2 — Escalas e Serviços
### US-005 — Criar escala de serviço
Como Coordenação, quero criar escalas de serviço para organizar Aluno de Dia, permanência, apoio interno, missões e demais funções acadêmico-militares.
#### Critérios de aceite
Deve ser possível criar escala por data.
Deve ser possível informar tipo de escala, função, aluno ou militar, horário, local, uniforme e observação.
Deve ser possível escalar Aluno de Dia ao Corpo de Alunos.
Deve ser possível escalar Aluno de Dia ao Pelotão.
Deve ser possível escalar permanência, apoio interno e apoio à instrução.
Escalas devem poder ser marcadas como publicáveis no BI.
Escalas validadas devem alimentar automaticamente a 3ª Parte do BI.
### US-006 — Detectar conflito de escala
Como Coordenação, quero ser alertado quando um aluno for escalado em funções incompatíveis no mesmo horário para evitar erro de serviço.
#### Critérios de aceite
O sistema deve alertar quando o mesmo aluno for escalado em duas funções no mesmo horário.
O alerta não precisa bloquear o lançamento no MVP, mas deve exigir confirmação da Coordenação.
O sistema deve exibir quais escalas estão em conflito.
O conflito deve aparecer antes da publicação do BI.
### US-007 — Registrar permuta de serviço
Como Coordenação, quero registrar permutas autorizadas para manter histórico e evitar divergência entre escala prevista e serviço executado.
#### Critérios de aceite
Deve ser possível selecionar escala original.
Deve ser possível informar substituído e substituto.
Deve ser obrigatório informar motivo ou observação.
A permuta deve exigir aprovação da Coordenação.
A escala atualizada deve aparecer corretamente no Livro de Dia e no BI, se for publicável.
## 5. Épico 3 — Livro de Dia
### US-008 — Criar Livro de Dia
Como Aluno de Dia ao Corpo de Alunos, quero abrir o Livro de Dia da data correspondente para registrar a rotina diária do CFO.
#### Critérios de aceite
Deve ser possível criar Livro de Dia por data.
O sistema deve impedir duplicidade de Livro de Dia para a mesma data e turma, salvo reabertura autorizada.
O Livro de Dia deve exibir data, aluno de dia, efetivo previsto, efetivo presente, registros e status.
O Livro de Dia deve iniciar em status “rascunho”.
O Livro de Dia deve poder ser enviado para revisão da Coordenação.
Após envio, o Aluno de Dia não deve conseguir editar livremente, salvo devolução para correção.
### US-009 — Pré-preencher Livro de Dia com escalas
Como Aluno de Dia, quero que o Livro de Dia já venha com as escalas do dia para reduzir digitação e evitar erro.
#### Critérios de aceite
O sistema deve puxar automaticamente as escalas cadastradas para a data.
Deve exibir Aluno de Dia ao Corpo de Alunos.
Deve exibir Alunos de Dia aos Pelotões.
Deve exibir outras funções de serviço cadastradas.
O Aluno de Dia deve conseguir confirmar ou registrar alteração.
Alterações na escala devem ficar pendentes de validação pela Coordenação.
### US-010 — Registrar efetivo diário
Como Aluno de Dia, quero registrar efetivo previsto e presente para controle da Coordenação e eventual publicação no BI.
#### Critérios de aceite
Deve existir campo para efetivo previsto.
Deve existir campo para efetivo presente.
O sistema deve calcular diferença entre previsto e presente.
Se houver diferença, o sistema deve solicitar registro de falta, baixa, dispensa ou observação.
O efetivo pode ficar apenas no sistema ou ser marcado como publicável pela Coordenação.
### US-011 — Registrar falta
Como Aluno de Dia, quero registrar falta de aluno para que a Coordenação avalie e valide o lançamento.
#### Critérios de aceite
Deve ser possível selecionar aluno.
Deve ser possível informar data, horário, atividade e disciplina, se houver.
Deve ser possível indicar se a falta foi informada, justificada ou sem justificativa.
O registro deve iniciar como pendente de validação.
A falta não deve entrar automaticamente no BI sem validação da Coordenação.
O sistema deve permitir anexar ou registrar existência de documento comprobatório, sem publicar o conteúdo no PDF.
Dados sensíveis não devem aparecer no PDF.
### US-012 — Registrar atraso
Como Aluno de Dia, quero registrar atraso de aluno para controle da rotina e validação da Coordenação.
#### Critérios de aceite
Deve ser possível selecionar aluno.
Deve ser possível informar horário previsto e horário de chegada.
Deve ser possível indicar atividade afetada.
O sistema deve calcular tempo aproximado de atraso.
O registro deve ficar pendente de validação.
A Coordenação decide se o atraso entra no BI ou fica apenas interno.
### US-013 — Registrar baixa ou atendimento de saúde
Como Aluno de Dia, quero registrar encaminhamento ou baixa de aluno para que a Coordenação acompanhe o impacto na atividade.
#### Critérios de aceite
Deve ser possível selecionar aluno.
Deve ser possível informar data, horário e atividade afetada.
Deve ser possível informar “encaminhado ao CSAU”, “dispensado de atividade”, “restrição temporária” ou opção semelhante.
O sistema não deve exigir nem publicar CID, diagnóstico ou detalhe médico.
O registro deve ser tratado como restrito por padrão.
A Coordenação pode gerar texto publicável sem informação sensível.
### US-014 — Registrar instrução ministrada
Como Aluno de Dia ou Instrutor, quero registrar instrução ministrada para que o sistema controle o que realmente ocorreu.
#### Critérios de aceite
Deve ser possível selecionar disciplina.
Deve ser possível selecionar instrutor.
Deve ser possível informar local.
Deve ser possível informar carga horária ministrada.
Deve ser possível informar conteúdo ministrado.
Deve ser possível informar efetivo presente e faltas relacionadas.
Deve ser possível registrar observações de segurança.
A instrução ministrada pode alimentar a 3ª Parte do BI após validação.
### US-015 — Registrar alteração de material
Como Aluno de Dia, quero registrar alteração de material para que a Coordenação acompanhe avarias, extravios, cautelas ou reposições.
#### Critérios de aceite
Deve ser possível informar material.
Deve ser possível informar patrimônio/tombamento, quando houver.
Deve ser possível informar local.
Deve ser possível informar tipo de alteração: avaria, extravio, cautela, devolução, manutenção, reposição ou outra.
Deve ser obrigatório descrever a alteração.
Deve ser possível informar providência adotada.
O registro deve ser validado pela Coordenação antes de entrar no BI.
Alteração pequena pode ficar apenas interna.
### US-016 — Registrar missão interna ou externa
Como Coordenação ou Aluno de Dia, quero registrar missões internas e externas para publicação no BI quando forem relevantes.
#### Critérios de aceite
Deve ser possível informar tipo de missão: interna ou externa.
Deve ser possível informar título da missão.
Deve ser possível informar local.
Deve ser possível informar horário de apresentação.
Deve ser possível informar horário de ativação e desativação, quando houver.
Deve ser possível informar responsável.
Deve ser possível informar efetivo empregado.
Deve ser possível informar viatura, uniforme e material.
Deve ser possível registrar resultado ou observação final.
Missões externas devem ser sugeridas como publicáveis.
Missões em apuração ou sensíveis devem poder ser marcadas como restritas.
### US-017 — Enviar Livro de Dia para revisão
Como Aluno de Dia, quero enviar o Livro de Dia para a Coordenação para que os registros sejam avaliados.
#### Critérios de aceite
O sistema deve possuir botão “Enviar para revisão”.
Antes de enviar, o sistema deve alertar registros incompletos.
Após envio, o status deve mudar para “aguardando revisão”.
A Coordenação deve ser capaz de visualizar o Livro de Dia enviado.
O Aluno de Dia deve conseguir visualizar, mas não editar, salvo devolução.
## 6. Épico 4 — Validação da Coordenação
### US-018 — Visualizar registros pendentes
Como Coordenação, quero visualizar registros pendentes para decidir o que será validado, corrigido, publicado, restringido ou arquivado.
#### Critérios de aceite
Deve existir uma tela de validação.
Deve ser possível filtrar por data.
Deve ser possível filtrar por tipo de registro.
Deve ser possível filtrar por aluno.
Deve ser possível filtrar por pelotão.
Deve ser possível filtrar por status.
A tela deve destacar registros pendentes, restritos e incompletos.
### US-019 — Validar registro
Como Coordenação, quero validar registros corretos para que possam ser usados na prévia do BI.
#### Critérios de aceite
Deve existir ação “validar”.
A validação deve registrar usuário, data e hora.
Registro validado deve ficar bloqueado para edição comum.
Registro validado pode ser marcado como publicável, interno ou restrito.
Registro validado e publicável pode entrar na prévia do BI.
### US-020 — Devolver registro para correção
Como Coordenação, quero devolver registros incompletos para correção pelo responsável.
#### Critérios de aceite
Deve existir ação “devolver para correção”.
Deve ser obrigatório informar motivo da devolução.
O status deve mudar para “pendente de correção”.
O responsável deve conseguir editar e reenviar.
O histórico da devolução deve ser preservado.
### US-021 — Classificar registro como publicável, interno ou restrito
Como Coordenação, quero classificar cada registro para controlar o que entra no PDF e o que fica apenas no sistema.
#### Critérios de aceite
Todo registro deve ter campo de classificação.
As opções mínimas devem ser: publicável, interno e restrito.
Registros restritos não devem aparecer na prévia do BI.
Registros internos não devem aparecer na prévia do BI.
Somente registros publicáveis e validados entram na prévia.
A classificação deve registrar quem classificou e quando.
### US-022 — Editar texto final de publicação
Como Coordenação, quero editar o texto final de publicação para deixar o BI formal, enxuto e adequado.
#### Critérios de aceite
Deve existir campo “texto para o BI”.
O sistema deve preservar o registro original.
A Coordenação pode editar o texto publicado sem alterar a descrição original.
O texto publicado deve ser usado na prévia e no PDF.
A alteração deve ficar registrada no histórico.
## 7. Épico 5 — Publicação do Boletim Interno
### US-023 — Criar Boletim Interno
Como Coordenação, quero criar um BI informando número, ano, data e período para consolidar registros validados.
#### Critérios de aceite
Deve ser possível informar número do BI.
Deve ser possível informar ano.
Deve ser possível informar data de publicação.
Deve ser possível informar data inicial e data final.
Se data inicial e final forem iguais, o sistema deve definir tipo “diário”.
Se data inicial e final forem diferentes, o sistema deve definir tipo “por período”.
O sistema deve impedir número duplicado no mesmo ano.
O BI deve iniciar como rascunho.
### US-024 — Buscar registros validados para o BI
Como Coordenação, quero que o sistema busque registros validados no período selecionado para montar a prévia do BI.
#### Critérios de aceite
O sistema deve buscar apenas registros dentro do período selecionado.
O sistema deve buscar apenas registros validados.
O sistema deve buscar apenas registros marcados como publicáveis.
Registros internos, restritos, cancelados ou pendentes não devem entrar.
O sistema deve separar os registros por parte do BI.
Em BI por período, o sistema deve agrupar registros por data.
### US-025 — Montar prévia do BI
Como Coordenação, quero visualizar a prévia do BI antes de gerar o PDF para conferir o documento final.
#### Critérios de aceite
A prévia deve exibir o cabeçalho institucional.
A prévia deve exibir número, ano, data de publicação e período.
A prévia deve exibir as cinco partes do BI.
Partes sem registros devem exibir “Sem alteração”.
A prévia deve exibir tabelas quando aplicável.
A prévia deve permitir ocultar item.
A prévia deve permitir reordenar item.
A prévia deve permitir editar texto final.
A prévia deve ter botão “aprovar para PDF”.
### US-026 — Aprovar Boletim Interno
Como Coordenação, quero aprovar o BI para bloquear a versão final antes da geração do PDF.
#### Critérios de aceite
Deve existir ação “aprovar BI”.
Apenas perfil autorizado pode aprovar.
Ao aprovar, o sistema deve congelar os itens do BI.
O status deve mudar para “aprovado”.
Após aprovação, alterações devem exigir nova versão ou reabertura controlada.
A aprovação deve registrar usuário, data e hora.
## 8. Épico 6 — Geração de PDF
### US-027 — Gerar PDF do BI
Como Coordenação, quero gerar o PDF do BI aprovado para publicação, envio ou arquivamento.
#### Critérios de aceite
O botão “gerar PDF” só deve estar disponível para BI aprovado.
O PDF deve usar os itens congelados do BI.
O PDF deve conter cabeçalho institucional.
O PDF deve conter número, ano, data e período, quando houver.
O PDF deve conter as cinco partes.
O PDF deve exibir “Sem alteração” nas partes vazias.
O PDF deve conter campo de aprovação.
O PDF deve conter rodapé com data de geração, página, versão e código de verificação.
O arquivo deve ser salvo no sistema.
O usuário deve conseguir baixar o PDF.
### US-028 — Gerar nome padronizado do arquivo
Como sistema, quero gerar nome padronizado para o PDF para facilitar arquivo e localização.
#### Critérios de aceite
O nome do arquivo deve conter BI, CFO, ano, número e data.
Para BI diário, usar formato: BI_CFO_2026_N005_02-06-2026.pdf.
Para BI por período, usar formato: BI_CFO_2026_N006_01-06-2026_a_03-06-2026.pdf.
O sistema deve evitar caracteres inválidos no nome do arquivo.
### US-029 — Criar nova versão do PDF
Como Coordenação, quero gerar nova versão do BI quando houver necessidade de correção posterior.
#### Critérios de aceite
BI já publicado não deve ser sobrescrito.
Nova versão deve incrementar o número de versão.
A versão anterior deve permanecer arquivada.
O sistema deve registrar motivo da nova versão.
O PDF novo deve indicar sua versão no rodapé.
Deve ser possível identificar se um BI foi substituído ou retificado.
## 9. Épico 7 — Repositório Documental
### US-030 — Listar Boletins Internos
Como usuário autorizado, quero listar os BIs gerados para consulta e download.
#### Critérios de aceite
Deve existir tela de repositório.
Deve listar número, ano, data, período, status e versão.
Deve permitir abrir detalhes do BI.
Deve permitir baixar PDF.
Deve permitir filtrar por ano.
Deve permitir filtrar por período.
Deve permitir buscar por número.
### US-031 — Consultar BI publicado
Como usuário autorizado, quero consultar um BI publicado para verificar informações oficiais já registradas.
#### Critérios de aceite
Deve ser possível abrir BI publicado.
Deve ser possível visualizar metadados.
Deve ser possível baixar PDF.
Deve ser possível ver se há versão posterior.
Usuário de consulta não deve conseguir editar BI.
### US-032 — Buscar BI por aluno ou missão
Como Coordenação, quero buscar BIs por aluno ou missão para localizar registros históricos.
#### Critérios de aceite
Deve ser possível buscar por nome de guerra ou número do aluno.
Deve ser possível buscar por título ou local de missão.
O resultado deve listar BIs relacionados.
A busca deve respeitar permissões de acesso.
Registros restritos não devem aparecer para usuários sem permissão.
## 10. Épico 8 — Segurança e Auditoria
### US-033 — Controlar acesso por perfil
Como Administrador, quero definir perfis de acesso para proteger dados e limitar ações conforme responsabilidade.
#### Critérios de aceite
Deve existir perfil de Administrador.
Deve existir perfil de Coordenação.
Deve existir perfil de Coordenador de Pelotão.
Deve existir perfil de Aluno de Dia ao Corpo de Alunos.
Deve existir perfil de Aluno de Dia ao Pelotão.
Deve existir perfil de Instrutor.
Deve existir perfil de Consulta.
Ações sensíveis devem exigir perfil autorizado.
Registros restritos só devem aparecer para perfis autorizados.
### US-034 — Registrar auditoria de ações importantes
Como sistema, quero registrar ações importantes para garantir rastreabilidade administrativa.
#### Critérios de aceite
O sistema deve registrar criação de BI.
O sistema deve registrar validação de registros.
O sistema deve registrar aprovação de BI.
O sistema deve registrar geração de PDF.
O sistema deve registrar alteração de classificação.
O sistema deve registrar criação de nova versão.
O log deve conter usuário, data, hora, ação e objeto afetado.
### US-035 — Proteger dados sensíveis
Como Coordenação, quero que dados médicos, disciplinares em apuração e informações pessoais sensíveis não apareçam indevidamente no PDF.
#### Critérios de aceite
Registros de saúde devem iniciar como restritos por padrão.
Registros disciplinares em apuração devem iniciar como restritos por padrão.
O sistema não deve publicar CID, diagnóstico, laudo ou documento médico no PDF.
Apenas texto administrativo validado pode ser publicado.
Usuários sem permissão não devem visualizar conteúdo restrito.
## 11. Critérios Gerais de Aceite do MVP
O MVP será considerado funcional quando permitir:
Cadastrar alunos, militares/instrutores e disciplinas;
Criar escalas simples;
Criar Livro de Dia por data;
Registrar faltas, atrasos, instruções, missões e alterações de material;
Enviar Livro de Dia para revisão;
Validar registros pela Coordenação;
Classificar registros como publicáveis, internos ou restritos;
Criar BI diário;
Criar BI por período;
Gerar prévia do BI;
Aprovar o BI;
Gerar PDF formal e legível;
Arquivar e consultar o BI gerado.
## 12. Definição de Pronto
Uma funcionalidade será considerada pronta quando:
estiver implementada;
respeitar permissões de acesso;
possuir validação mínima dos campos obrigatórios;
funcionar em desktop e smartphone;
não permitir publicação de dados pendentes;
não expor dados restritos indevidamente;
estiver integrada ao fluxo principal;
não quebrar geração do PDF;
tiver sido testada com pelo menos um caso real ou simulado do CFO.
## 13. Prioridade das User Stories no MVP
### Prioridade Alta
US-001 Cadastrar aluno oficial;
US-002 Cadastrar militar, instrutor ou monitor;
US-003 Cadastrar disciplina;
US-005 Criar escala de serviço;
US-008 Criar Livro de Dia;
US-011 Registrar falta;
US-012 Registrar atraso;
US-014 Registrar instrução ministrada;
US-016 Registrar missão interna ou externa;
US-017 Enviar Livro de Dia para revisão;
US-018 Visualizar registros pendentes;
US-019 Validar registro;
US-021 Classificar registro;
US-023 Criar Boletim Interno;
US-024 Buscar registros validados;
US-025 Montar prévia do BI;
US-026 Aprovar Boletim Interno;
US-027 Gerar PDF do BI;
US-030 Listar Boletins Internos;
US-033 Controlar acesso por perfil.
### Prioridade Média
US-004 Cadastrar locais de instrução;
US-006 Detectar conflito de escala;
US-009 Pré-preencher Livro de Dia com escalas;
US-010 Registrar efetivo diário;
US-013 Registrar baixa ou atendimento de saúde;
US-015 Registrar alteração de material;
US-020 Devolver registro para correção;
US-022 Editar texto final de publicação;
US-028 Gerar nome padronizado do arquivo;
US-031 Consultar BI publicado;
US-034 Registrar auditoria.
### Prioridade Baixa para MVP
US-007 Registrar permuta de serviço;
US-029 Criar nova versão do PDF;
US-032 Buscar BI por aluno ou missão;
US-035 Proteger dados sensíveis com regras avançadas.
## 14. Observação Final
O desenvolvimento deve priorizar o fluxo principal antes de criar recursos avançados.
A ordem recomendada de implementação é:
Cadastros básicos;
Escalas simples;
Livro de Dia;
Registros;
Validação;
Prévia do BI;
PDF;
Repositório.
O sistema deve evitar complexidade inicial. O primeiro objetivo é gerar um Boletim Interno real, confiável, enxuto e bem formatado.