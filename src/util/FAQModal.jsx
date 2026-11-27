import React, { useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FAQ_DATA = [
  {
    id: '1',
    question: 'What is the Directory and the Activity Feed?',
    answer:
      'The Directory (left column) lists people and teams your office allows you to reach, with shortcuts for email, in-app chat, WhatsApp, and SMS when those channels are enabled. The Activity Feed (middle column) shows recent conversations and unread counts—click a row to open that thread.',
  },
  {
    id: '2',
    question: 'How do I start a WhatsApp chat?',
    answer:
      'Find the person in the Directory and use the WhatsApp action on their row, or switch the open conversation to the WhatsApp channel if your layout shows channel tabs. If your organization uses templates, choose an approved template when prompted, then send your message.',
  },
  {
    id: '3',
    question: 'How do I start an SMS chat?',
    answer:
      'Use the SMS action from a contact in the Directory (when your role has SMS), or start a conversation using the SMS channel where the dashboard provides it. The contact needs a valid mobile number.',
  },
  {
    id: '4',
    question:
      'What is the "Dialer Contact" badge and how do I find those users?',
    answer:
      'When you reach someone by dialing a phone number—through Start New Conversation (+), the Phone Dialer, or the WhatsApp/SMS contact pickers—they may appear with a Dialer Contact badge on their row. That badge means the person is not yet saved as a full contact in your Directory; you can chat with them, but they are easy to overlook among regular contacts. To find them later, search by phone number in the Directory, WhatsApp, or SMS lists, or open the thread from the Activity Feed. Look for the Dialer Contact badge on the name row. When you have the conversation open, use Add to Contacts in the message header to save them with a name, user type, and other details so they appear like your other directory contacts.',
  },
  {
    id: '5',
    question: 'How do I find someone I messaged who is not saved as a contact?',
    answer:
      'Unsaved contacts usually show up as a phone number (sometimes with a Dialer Contact badge) instead of a full name. The quickest way to find them again is the Activity Feed—open the middle column and look for the recent thread; click the row to reopen the chat. You can also search by phone number in the Directory, or in the WhatsApp and SMS contact pickers on the right. In Start New Conversation (+), use the Contacts tab and search by number if you remember it. If you still cannot find them, dial or enter the number again from the Phone Dialer or WhatsApp/SMS section to restart the conversation. To keep them for next time, open the chat and click Add to Contacts in the message header.',
  },
  {
    id: '6',
    question: 'How do I send an email to a user?',
    answer:
      'Pick someone in the Directory and use the email shortcut, or fill the To field in the Email column on the right, add Subject and Body, choose a Signature, then click Send Mail.',
  },
  {
    id: '7',
    question: 'Where can I see notifications?',
    answer:
      'Use the message icon in the top header for alerts. You will also see unread badges on Activity Feed rows and other indicators while you work in the Communication Dashboard.',
  },
  {
    id: '8',
    question: 'Where can I see email history?',
    answer:
      'In the Email column, open Email History (near the bottom next to Send Mail). A side panel lists messages you have sent so you can review them.',
  },
  {
    id: '9',
    question: 'Where can I find group chat?',
    answer:
      'In the Directory, open the Groups section (or the group category your office uses). Expand a group to see its members and open the group conversation.',
  },
  {
    id: '10',
    question: 'How do I reply to visitors who started a chat from the website?',
    answer:
      'Those conversations usually appear in the Activity Feed under categories such as Visitors or Leads. Click the thread to open it, then type your reply in the chat area and send like any other conversation.',
  },
  {
    id: '11',
    question: 'How can I view the tutorial?',
    answer:
      'Click Tutorial in the page footer to open the user guide (PDF). If nothing appears, ask your administrator to configure the tutorial document URL for your deployment.',
  },
  {
    id: '12',
    question: 'How can I see a summary of the chat?',
    answer:
      'With a conversation open, use the chat toolbar menu (three dots / options) and choose Summary to open a modal with highlights and message stats for that thread.',
  },
  {
    id: '13',
    question: 'Can I download the chat history?',
    answer:
      'Yes. Open the same chat options menu and choose Export. The app builds a PDF of the thread and saves it to your computer.',
  },
  {
    id: '14',
    question: 'How do I print the chat history?',
    answer:
      'Open the chat options menu and choose Print. A print-friendly view opens so you can send the conversation to your printer.',
  },
  {
    id: '15',
    question:
      'Why do I have to select a WhatsApp template every time I start a chat?',
    answer:
      'WhatsApp Business rules require many outbound starts to go through pre-approved templates so Meta can verify message content. Each new outbound session must pick a template; your integration follows that policy to keep the channel compliant.',
  },
];

const FAQ_TRANSLATIONS = {
  English: {
    title: '❔ Frequently asked questions',
    subtitle: 'Select a question on the left to see the answer.',
    search: 'Search questions or answers...',
    noQuestions: 'No questions found.',
    selectQuestion: 'Select a question to see the answer.',
    close: 'Close',
    translating: 'Frequently asked questions',

    questions: FAQ_DATA,
  },

  Spanish: {
    title: '❔ Preguntas frecuentes',
    subtitle: 'Selecciona una pregunta a la izquierda para ver la respuesta.',
    search: 'Buscar preguntas o respuestas...',
    noQuestions: 'No se encontraron preguntas.',
    selectQuestion: 'Selecciona una pregunta para ver la respuesta.',
    close: 'Cerrar',
    translating: 'Preguntas frecuentes',

    questions: [
      {
        id: '1',
        question: '¿Qué son el directorio y el feed de actividad?',
        answer:
          'El directorio muestra las personas y los equipos con los que puedes comunicarte. El feed de actividad muestra las conversaciones recientes y los mensajes sin leer.',
      },
      {
        id: '2',
        question: '¿Cómo inicio un chat de WhatsApp?',
        answer:
          'Busca a la persona en el directorio y utiliza la opción de WhatsApp. Si se requiere una plantilla aprobada, selecciónala antes de enviar el mensaje.',
      },
      {
        id: '3',
        question: '¿Cómo inicio un chat por SMS?',
        answer:
          'Utiliza la opción SMS de un contacto o selecciona el canal SMS. El contacto debe tener un número de teléfono móvil válido.',
      },
      {
        id: '4',
        question: '¿Qué significa la etiqueta Contacto del marcador?',
        answer:
          'Esta etiqueta indica que la persona todavía no está guardada como contacto completo en el directorio. Puedes buscarla por número de teléfono y utilizar Añadir a contactos para guardarla.',
      },
      {
        id: '5',
        question:
          '¿Cómo encuentro a alguien que no está guardado como contacto?',
        answer:
          'Busca el número de teléfono en el directorio, en las listas de WhatsApp o SMS, o abre la conversación reciente desde el feed de actividad.',
      },
      {
        id: '6',
        question: '¿Cómo envío un correo electrónico a un usuario?',
        answer:
          'Selecciona a una persona en el directorio, introduce el destinatario, el asunto y el mensaje, selecciona una firma y pulsa Enviar correo.',
      },
      {
        id: '7',
        question: '¿Dónde puedo ver las notificaciones?',
        answer:
          'Utiliza el icono de mensajes en la parte superior. También puedes ver indicadores de mensajes sin leer en el feed de actividad.',
      },
      {
        id: '8',
        question: '¿Dónde puedo ver el historial de correos electrónicos?',
        answer:
          'Abre Historial de correo electrónico en la sección de correo para revisar los mensajes enviados.',
      },
      {
        id: '9',
        question: '¿Dónde puedo encontrar el chat grupal?',
        answer:
          'Abre la sección Grupos del directorio, expande un grupo y selecciona la conversación correspondiente.',
      },
      {
        id: '10',
        question:
          '¿Cómo respondo a los visitantes que iniciaron un chat desde el sitio web?',
        answer:
          'Busca la conversación en el feed de actividad, abre el hilo, escribe tu respuesta y envía el mensaje.',
      },
      {
        id: '11',
        question: '¿Cómo puedo ver el tutorial?',
        answer:
          'Pulsa Tutorial en el pie de página para abrir la guía del usuario en PDF.',
      },
      {
        id: '12',
        question: '¿Cómo puedo ver un resumen del chat?',
        answer:
          'Abre una conversación, utiliza el menú de opciones del chat y selecciona Resumen.',
      },
      {
        id: '13',
        question: '¿Puedo descargar el historial del chat?',
        answer:
          'Sí. Abre el menú de opciones del chat y selecciona Exportar para generar un PDF de la conversación.',
      },
      {
        id: '14',
        question: '¿Cómo imprimo el historial del chat?',
        answer: 'Abre el menú de opciones del chat y selecciona Imprimir.',
      },
      {
        id: '15',
        question:
          '¿Por qué debo seleccionar una plantilla de WhatsApp cada vez que inicio un chat?',
        answer:
          'Las reglas de WhatsApp Business requieren plantillas previamente aprobadas para muchos mensajes iniciados por una empresa.',
      },
    ],
  },

  Portuguese: {
    title: '❔ Perguntas frequentes',
    subtitle: 'Selecione uma pergunta à esquerda para ver a resposta.',
    search: 'Pesquisar perguntas ou respostas...',
    noQuestions: 'Nenhuma pergunta encontrada.',
    selectQuestion: 'Selecione uma pergunta para ver a resposta.',
    close: 'Fechar',
    translating: 'Perguntas frequentes',

    questions: [
      {
        id: '1',
        question: 'O que são o Diretório e o Feed de atividades?',
        answer:
          'O Diretório lista as pessoas e equipes com as quais você pode entrar em contato. O Feed de atividades mostra conversas recentes e mensagens não lidas.',
      },
      {
        id: '2',
        question: 'Como inicio uma conversa no WhatsApp?',
        answer:
          'Encontre a pessoa no Diretório e use a opção WhatsApp. Se for necessário um modelo aprovado, selecione-o antes de enviar a mensagem.',
      },
      {
        id: '3',
        question: 'Como inicio uma conversa por SMS?',
        answer:
          'Use a opção SMS de um contato ou selecione o canal SMS. O contato precisa ter um número de celular válido.',
      },
      {
        id: '4',
        question: 'O que significa o selo Contato do discador?',
        answer:
          'Esse selo indica que a pessoa ainda não está salva como um contato completo no Diretório. Você pode pesquisar pelo número e usar Adicionar aos contatos para salvá-la.',
      },
      {
        id: '5',
        question: 'Como encontro alguém que não está salvo como contato?',
        answer:
          'Pesquise o número de telefone no Diretório, nas listas de WhatsApp ou SMS, ou abra a conversa recente no Feed de atividades.',
      },
      {
        id: '6',
        question: 'Como envio um e-mail para um usuário?',
        answer:
          'Selecione uma pessoa no Diretório, informe o destinatário, o assunto e a mensagem, escolha uma assinatura e clique em Enviar e-mail.',
      },
      {
        id: '7',
        question: 'Onde posso ver as notificações?',
        answer:
          'Use o ícone de mensagens no cabeçalho superior. Você também verá indicadores de mensagens não lidas no Feed de atividades.',
      },
      {
        id: '8',
        question: 'Onde posso ver o histórico de e-mails?',
        answer:
          'Abra Histórico de e-mails na seção de e-mail para revisar as mensagens enviadas.',
      },
      {
        id: '9',
        question: 'Onde posso encontrar o chat em grupo?',
        answer:
          'Abra a seção Grupos no Diretório, expanda um grupo e selecione a conversa correspondente.',
      },
      {
        id: '10',
        question:
          'Como respondo aos visitantes que iniciaram um chat pelo site?',
        answer:
          'Encontre a conversa no Feed de atividades, abra o tópico, escreva sua resposta e envie a mensagem.',
      },
      {
        id: '11',
        question: 'Como posso visualizar o tutorial?',
        answer:
          'Clique em Tutorial no rodapé da página para abrir o guia do usuário em PDF.',
      },
      {
        id: '12',
        question: 'Como posso ver um resumo do chat?',
        answer:
          'Abra uma conversa, use o menu de opções do chat e selecione Resumo.',
      },
      {
        id: '13',
        question: 'Posso baixar o histórico do chat?',
        answer:
          'Sim. Abra o menu de opções do chat e selecione Exportar para gerar um PDF da conversa.',
      },
      {
        id: '14',
        question: 'Como imprimo o histórico do chat?',
        answer: 'Abra o menu de opções do chat e selecione Imprimir.',
      },
      {
        id: '15',
        question:
          'Por que preciso selecionar um modelo do WhatsApp sempre que inicio um chat?',
        answer:
          'As regras do WhatsApp Business exigem modelos previamente aprovados para muitas mensagens iniciadas por uma empresa.',
      },
    ],
  },
};

const FAQModal = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('1');
  const [language, setLanguage] = useState('English');
  const [showLanguages, setShowLanguages] = useState(false);
  const [translatedFAQs, setTranslatedFAQs] = useState(FAQ_DATA);
  const [isTranslating, setIsTranslating] = useState(false);

  const languages = ['English', 'Spanish', 'Portuguese'];

  const currentTranslation = FAQ_TRANSLATIONS[language];

  const filteredFAQs = useMemo(() => {
    const query = search.trim().toLowerCase();
    const questions = currentTranslation.questions;

    if (!query) return questions;

    return questions.filter(
      item =>
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query),
    );
  }, [search, currentTranslation]);

  const selectedFAQ =
    filteredFAQs.find(item => item.id === selectedId) || filteredFAQs[0];

  const handleSearch = value => {
    setSearch(value);
    setSelectedId('');
  };

  const handleClose = () => {
    setSearch('');
    setSelectedId('1');
    setShowLanguages(false);
    onClose();
  };

  const renderQuestion = ({ item }) => {
    const isSelected = selectedFAQ?.id === item.id;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setSelectedId(item.id)}
        style={[styles.questionItem, isSelected && styles.selectedQuestion]}
      >
        <Text style={styles.questionMark}>❓</Text>

        <Text style={styles.questionText}>{item.question}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View
        style={[
          styles.overlay,
          Platform.OS === 'ios' && {
            paddingTop: Math.max(insets.top, 8) + 8,
            paddingBottom: Math.max(insets.bottom, 8) + 8,
          },
        ]}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>{currentTranslation.title}</Text>

              <TouchableOpacity
                onPress={handleClose}
                style={styles.headerClose}
              >
                <Text style={styles.headerCloseText}>×</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.headerSubtitle}>
              {currentTranslation.subtitle}
            </Text>
          </View>

          {/* Search and language */}
          <View style={styles.toolbar}>
            <TextInput
              value={search}
              onChangeText={handleSearch}
              placeholder={currentTranslation.search}
              placeholderTextColor="#777777"
              style={styles.searchInput}
            />

            <View style={styles.languageContainer}>
              <TouchableOpacity
                style={styles.languageButton}
                onPress={() => setShowLanguages(!showLanguages)}
              >
                <Text style={styles.languageText}>{language}</Text>
                <Image
                  source={require('../asset/chevron-down.png')}
                  style={styles.arrowImage}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              {showLanguages && (
                <View style={styles.languageDropdown}>
                  {languages.map(item => (
                    <TouchableOpacity
                      key={item}
                      style={styles.languageOption}
                      onPress={() => {
                        setLanguage(item);
                        setSelectedId('1');
                        setSearch('');
                        setShowLanguages(false);
                      }}
                    >
                      <Text style={styles.languageOptionText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Questions and answers */}
          <View style={styles.content}>
            <View style={styles.questionPanel}>
              <FlatList
                data={filteredFAQs}
                keyExtractor={item => item.id}
                renderItem={renderQuestion}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No questions found.</Text>
                }
              />
            </View>

            <View style={styles.answerPanel}>
              {selectedFAQ ? (
                <ScrollView
                  showsVerticalScrollIndicator
                  contentContainerStyle={styles.answerScroll}
                >
                  <View style={styles.answerCard}>
                    <Text style={styles.answerTitle}>
                      {selectedFAQ.question}
                    </Text>

                    <Text style={styles.answerText}>{selectedFAQ.answer}</Text>
                  </View>
                </ScrollView>
              ) : (
                <View style={styles.noAnswer}>
                  <Text style={styles.noAnswerText}>
                    {currentTranslation.selectQuestion}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeButtonText}>
                {currentTranslation.close}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default FAQModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },

  modalContainer: {
    width: '100%',
    height: '94%',
    backgroundColor: '#E7EEF9',
    borderRadius: 10,
    overflow: 'hidden',
  },

  header: {
    backgroundColor: '#3B489F',
    paddingHorizontal: 14,
    paddingTop: 9,
    paddingBottom: 10,
  },

  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  headerClose: {
    paddingHorizontal: 5,
    paddingVertical: 0,
  },

  headerCloseText: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 30,
  },

  headerSubtitle: {
    color: '#FFFFFF',
    fontSize: 11,
    marginTop: 3,
  },

  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 8,
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },

  searchInput: {
    flex: 1,
    height: 34,
    borderRadius: 18,
    backgroundColor: '#F5F6F7',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    fontSize: 12,
    color: '#172033',
  },

  languageContainer: {
    width: 118,
    position: 'relative',
    zIndex: 20,
  },

  languageButton: {
    height: 34,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D5D8E0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  languageText: {
    color: '#172033',
    fontSize: 12,
    fontWeight: '600',
  },

  arrow: {
    color: '#172033',
    fontSize: 18,
  },

  languageDropdown: {
    position: 'absolute',
    top: 38,
    right: 0,
    left: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    elevation: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },

  languageOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  languageOptionText: {
    color: '#172033',
    fontSize: 12,
  },

  content: {
    flex: 1,
    flexDirection: 'row',
    minHeight: 0,
  },

  questionPanel: {
    width: '43%',
    borderRightWidth: 1,
    borderRightColor: '#D5DCE8',
    backgroundColor: '#F7F8FA',
  },

  questionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 3,
    marginTop: 5,
    paddingHorizontal: 10,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E3E8',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },

  selectedQuestion: {
    backgroundColor: '#EEF3FF',
    borderColor: '#9AB7FF',
  },

  questionMark: {
    fontSize: 12,
    marginTop: 1,
  },

  questionText: {
    flex: 1,
    color: '#172033',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },

  answerPanel: {
    flex: 1,
    minWidth: 0,
    padding: 10,
  },

  answerScroll: {
    flexGrow: 1,
  },

  answerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  answerTitle: {
    color: '#172033',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
    marginBottom: 8,
  },

  answerText: {
    color: '#4A5264',
    fontSize: 13,
    lineHeight: 20,
  },

  emptyText: {
    color: '#6B7280',
    textAlign: 'center',
    padding: 15,
    fontSize: 12,
  },

  noAnswer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },

  noAnswerText: {
    color: '#6B7280',
    textAlign: 'center',
    fontSize: 13,
  },

  footer: {
    minHeight: 58,
    backgroundColor: '#E7EEF9',
    borderTopWidth: 1,
    borderTopColor: '#D5DCE8',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },

  closeButton: {
    backgroundColor: '#FF4B20',
    paddingHorizontal: 17,
    paddingVertical: 10,
    borderRadius: 7,
  },

  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  arrowImage: {
    width: 16,
    height: 16,
    tintColor: '#172033',
  },
});
