import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { BULLETIN_PARTS } from "@/lib/records/options";
import type { BulletinPdfData, BulletinPdfItem } from "./types";

type BulletinPdfDocumentProps = {
  data: BulletinPdfData;
  generatedAt: Date;
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingRight: 42,
    paddingBottom: 42,
    paddingLeft: 42,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#111827",
    lineHeight: 1.35,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: "#9ca3af",
    borderBottomStyle: "solid",
    paddingBottom: 10,
    textAlign: "center",
  },
  institution: {
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
  },
  subtitle: {
    marginTop: 3,
    fontSize: 9,
    textTransform: "uppercase",
    color: "#374151",
  },
  documentNumber: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: 700,
  },
  meta: {
    marginTop: 3,
    fontSize: 9,
    color: "#4b5563",
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    paddingVertical: 5,
    paddingHorizontal: 7,
    backgroundColor: "#e5e7eb",
    fontSize: 9,
    fontWeight: 700,
    textTransform: "uppercase",
  },
  empty: {
    marginTop: 7,
    fontSize: 10,
    fontStyle: "italic",
    color: "#6b7280",
  },
  item: {
    marginTop: 8,
    paddingBottom: 7,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
    borderBottomStyle: "solid",
  },
  itemTitle: {
    fontSize: 10,
    fontWeight: 700,
  },
  itemContent: {
    marginTop: 2,
    fontSize: 10,
  },
  itemDate: {
    marginTop: 3,
    fontSize: 8,
    color: "#6b7280",
  },
  approval: {
    marginTop: 26,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#d1d5db",
    borderTopStyle: "solid",
    textAlign: "center",
    fontSize: 9,
    color: "#374151",
  },
  footer: {
    position: "absolute",
    left: 42,
    right: 42,
    bottom: 20,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: "#d1d5db",
    borderTopStyle: "solid",
    fontSize: 8,
    color: "#6b7280",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

function formatDate(date: string | null): string {
  if (!date) return "-";
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function itemsForPart(items: BulletinPdfItem[], part: number): BulletinPdfItem[] {
  return items.filter((item) => item.partNumber === part);
}

export function BulletinPdfDocument({
  data,
  generatedAt,
}: BulletinPdfDocumentProps) {
  const period =
    data.startDate === data.endDate
      ? formatDate(data.startDate)
      : `${formatDate(data.startDate)} a ${formatDate(data.endDate)}`;

  return (
    <Document title={`BI ${data.number}/${data.year}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.institution}>Academia Bombeiro Militar - CBMAP</Text>
          <Text style={styles.subtitle}>
            Curso de Formacao de Oficiais - Boletim Interno
          </Text>
          <Text style={styles.documentNumber}>
            BI no {data.number}/{data.year} - {data.type}
          </Text>
          <Text style={styles.meta}>
            Periodo: {period}
            {data.publicationDate
              ? ` - Publicacao: ${formatDate(data.publicationDate)}`
              : ""}
          </Text>
        </View>

        {BULLETIN_PARTS.map((part) => {
          const partNumber = Number(part.value);
          const partItems = itemsForPart(data.items, partNumber);

          return (
            <View key={part.value} style={styles.section} wrap={false}>
              <Text style={styles.sectionTitle}>{part.label}</Text>
              {partItems.length === 0 ? (
                <Text style={styles.empty}>Sem alteracao.</Text>
              ) : (
                partItems.map((item) => (
                  <View key={item.id} style={styles.item}>
                    {item.title ? (
                      <Text style={styles.itemTitle}>{item.title}</Text>
                    ) : null}
                    <Text style={styles.itemContent}>{item.content}</Text>
                    {item.referenceDate ? (
                      <Text style={styles.itemDate}>
                        Data de referencia: {formatDate(item.referenceDate)}
                      </Text>
                    ) : null}
                  </View>
                ))
              )}
            </View>
          );
        })}

        <View style={styles.approval}>
          <Text>
            Aprovado pela Coordenacao do CFO
            {data.approvedAt ? ` em ${formatDateTime(new Date(data.approvedAt))}` : ""}
          </Text>
        </View>

        <View style={styles.footer} fixed>
          <Text>BI-CFO - versao {data.version}</Text>
          <Text>Gerado em {formatDateTime(generatedAt)}</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Pagina ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
