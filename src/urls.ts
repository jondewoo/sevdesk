const DEFAULT_BASE_URL = "https://my.sevdesk.de/";

type Query = Record<string, any>;

type DefaultCollectionQuery = {
  limit?: number;
  offset?: number;
  embed?: Array<string>;
  countAll?: boolean;
};

export class SevDeskUrls {
  constructor(private baseUrl = DEFAULT_BASE_URL) {}

  apiUrl({
    version = 1,
    path,
    query = {},
  }: {
    version?: number;
    path: string;
    query?: Query;
  }) {
    const url = new URL(path, `${this.baseUrl}api/v${version}/`);

    Object.entries(query).forEach(([key, value]) => {
      const values = Array.isArray(value) ? value : [value];

      values.forEach((value) => {
        url.searchParams.append(key, value);
      });
    });

    return url.toString();
  }

  // -------------------------------------------------------
  // Invoice
  // -------------------------------------------------------

  apiGetInvoicesUrl({ ...query }: DefaultCollectionQuery & Query = {}) {
    return this.apiUrl({ path: `Invoice`, query });
  }

  apiGetInvoiceUrl({ id, ...query }: { id: string } & Query) {
    return this.apiUrl({ path: `Invoice/${id}`, query });
  }

  apiGetNextInvoiceNumberUrl({
    ...query
  }: { invoiceType: string; useNextNumber: boolean } & Query) {
    return this.apiUrl({ path: `Invoice/Factory/getNextInvoiceNumber`, query });
  }

  apiSaveInvoiceUrl({ ...query }: Query = {}) {
    return this.apiUrl({ path: `Invoice/Factory/saveInvoice`, query });
  }

  apiUpdateInvoiceUrl({ id, ...query }: { id: string } & Query) {
    return this.apiUrl({ path: `Invoice/${id}`, query });
  }

  apiRenderInvoiceUrl({ id, ...query }: { id: string } & Query) {
    return this.apiUrl({ path: `Invoice/${id}/render`, query });
  }

  apiDeleteInvoiceUrl({ id, ...query }: { id: string } & Query) {
    return this.apiUrl({ path: `Invoice/${id}`, query });
  }

  apiInvoiceSendByUrl({ id, ...query }: { id: string } & Query) {
    return this.apiUrl({ path: `Invoice/${id}/sendBy`, query });
  }

  viewInvoiceUrl({ id }: { id: string }) {
    return `${this.baseUrl}#/fi/edit/type/RE/id/${id}`;
  }

  apiGetInvoiceXmlUrl({ id }: { id: string }) {
    return this.apiUrl({ path: `Invoice/${id}/getXml` });
  }

  apiCancelInvoiceUrl({ id }: { id: string }) {
    return this.apiUrl({ path: `Invoice/${id}/cancelInvoice` });
  }

  // -------------------------------------------------------
  // Credit Note
  // -------------------------------------------------------

  apiGetCreditNotesUrl({ ...query }: DefaultCollectionQuery & Query = {}) {
    return this.apiUrl({ path: `CreditNote`, query });
  }

  apiGetCreditNoteUrl({ id, ...query }: { id: string } & Query) {
    return this.apiUrl({ path: `CreditNote/${id}`, query });
  }

  apiGetNextCreditNoteNumberUrl({
    ...query
  }: { creditNoteType: string; useNextNumber: boolean } & Query) {
    return this.apiUrl({
      path: `CreditNote/Factory/getNextCreditNoteNumber`,
      query,
    });
  }

  apiSaveCreditNoteUrl({ ...query }: Query = {}) {
    return this.apiUrl({ path: `CreditNote/Factory/saveCreditNote`, query });
  }

  apiUpdateCreditNoteUrl({ id, ...query }: { id: string } & Query) {
    return this.apiUrl({ path: `CreditNote/${id}`, query });
  }

  apiDeleteCreditNoteUrl({ id, ...query }: { id: string } & Query) {
    return this.apiUrl({ path: `CreditNote/${id}`, query });
  }

  apiRenderCreditNoteUrl({ id, ...query }: { id: string } & Query) {
    return this.apiUrl({ path: `CreditNote/${id}/render`, query });
  }

  apiGetCreditNoteXmlUrl({ id }: { id: string }) {
    return this.apiUrl({ path: `CreditNote/${id}/getXml` });
  }

  apiCreditNoteSendByUrl({ id, ...query }: { id: string } & Query) {
    return this.apiUrl({ path: `CreditNote/${id}/sendBy`, query });
  }

  // -------------------------------------------------------
  // Voucher
  // -------------------------------------------------------

  apiVoucherUrl({ ...query }: DefaultCollectionQuery & Query = {}) {
    return this.apiUrl({ path: `Voucher`, query });
  }

  // -------------------------------------------------------
  // VoucherPos
  // -------------------------------------------------------

  apiVoucherPosUrl({
    voucherId,
    ...query
  }: {
    voucherId?: number;
  } & DefaultCollectionQuery &
    Query = {}) {
    const voucher = voucherId
      ? { "voucher[id]": voucherId, "voucher[objectName]": "Voucher" }
      : {};

    return this.apiUrl({ path: `VoucherPos`, query: { ...voucher, ...query } });
  }

  // -------------------------------------------------------
  // DocumentFolders
  // -------------------------------------------------------

  apiGetDocumentFoldersUrl({ ...query }: DefaultCollectionQuery & Query = {}) {
    return this.apiUrl({ path: `DocumentFolder`, query });
  }

  // -------------------------------------------------------
  // Document
  // -------------------------------------------------------

  apiGetDocumentsUrl({ ...query }: DefaultCollectionQuery & Query = {}) {
    return this.apiUrl({ path: `Document`, query });
  }

  apiFileUploadUrl({
    // The root folder is "null"
    folder = "null",
    ...query
  }: { object?: string; folder?: string } & Query = {}) {
    return this.apiUrl({
      path: `Document/Factory/fileUpload`,
      query: { folder, ...query },
    });
  }

  // -------------------------------------------------------
  // Contact
  // -------------------------------------------------------

  apiCreateContactUrl({ ...query }: Query = {}) {
    return this.apiUrl({
      path: `Contact`,
      query,
    });
  }

  apiUpdateContactUrl({ id, ...query }: { id: string } & Query) {
    return this.apiUrl({ path: `Contact/${id}`, query });
  }

  apiGetContactsUrl({ ...query }: DefaultCollectionQuery & Query = {}) {
    return this.apiUrl({
      path: `Contact`,
      query,
    });
  }

  // -------------------------------------------------------
  // ContactAddress
  // -------------------------------------------------------

  apiCreateContactAddressUrl({ ...query }: Query = {}) {
    return this.apiUrl({
      path: `ContactAddress`,
      query,
    });
  }

  apiUpdateContactAddressUrl({ id, ...query }: { id: string } & Query) {
    return this.apiUrl({ path: `ContactAddress/${id}`, query });
  }

  apiGetContactAddressesUrl({
    contactId,
    ...query
  }: { contactId?: string | undefined } & DefaultCollectionQuery & Query = {}) {
    if (contactId) {
      return this.apiUrl({
        path: `Contact/${contactId}/getAddresses`,
        query,
      });
    }

    return this.apiUrl({
      path: `ContactAddress`,
      query,
    });
  }

  // -------------------------------------------------------
  // CommunicationWay
  // -------------------------------------------------------

  apiCreateCommunicationWayUrl({ ...query }: Query = {}) {
    return this.apiUrl({
      path: `CommunicationWay`,
      query,
    });
  }

  apiUpdateCommunicationWayUrl({ id, ...query }: { id: string } & Query) {
    return this.apiUrl({ path: `CommunicationWay/${id}`, query });
  }

  apiDeleteCommunicationWayUrl({ id, ...query }: { id: string } & Query) {
    return this.apiUrl({ path: `CommunicationWay/${id}`, query });
  }

  apiGetCommunicationWaysUrl({
    ...query
  }: DefaultCollectionQuery & Query = {}) {
    return this.apiUrl({
      path: `CommunicationWay`,
      query,
    });
  }

  // -------------------------------------------------------
  // Unity
  // -------------------------------------------------------

  apiGetUnitiesUrl({ ...query }: DefaultCollectionQuery & Query = {}) {
    return this.apiUrl({
      path: `Unity`,
      query,
    });
  }

  // -------------------------------------------------------
  // PaymentMethod
  // -------------------------------------------------------

  apiGetPaymentMethodsUrl({ ...query }: DefaultCollectionQuery & Query = {}) {
    return this.apiUrl({
      path: `PaymentMethod`,
      query,
    });
  }

  // -------------------------------------------------------
  // Tag
  // -------------------------------------------------------

  apiGetTagsUrl({ ...query }: DefaultCollectionQuery & Query = {}) {
    return this.apiUrl({
      path: `Tag`,
      query,
    });
  }

  // -------------------------------------------------------
  // SevUser
  // -------------------------------------------------------

  apiGetSevUsersUrl({ ...query }: DefaultCollectionQuery & Query = {}) {
    return this.apiUrl({
      path: `SevUser`,
      query,
    });
  }

  // -------------------------------------------------------
  // StaticCountry
  // -------------------------------------------------------

  apiGetStaticCountriesUrl({ ...query }: DefaultCollectionQuery & Query = {}) {
    return this.apiUrl({
      path: `StaticCountry`,
      query,
    });
  }

  // -------------------------------------------------------
  // Part
  // -------------------------------------------------------

  apiGetPartsUrl({ ...query }: DefaultCollectionQuery & Query = {}) {
    return this.apiUrl({
      path: `Part`,
      query,
    });
  }

  // -------------------------------------------------------
  // Tag
  // -------------------------------------------------------

  apiCreateTagUrl({ ...query }: Query = {}) {
    return this.apiUrl({
      path: `Tag/Factory/create`,
      query,
    });
  }
}
