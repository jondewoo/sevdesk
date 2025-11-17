import NodeFormData from "form-data";
import { dependencies } from "./dependencies.js";
import { UnknownApiError } from "./errors.js";
import {
  ModelBookkeepingSystemVersion,
  ModelCommunicationWay,
  ModelContact,
  ModelContactAddress,
  ModelCreditNote,
  ModelCreditNotePos,
  ModelDocument,
  ModelDocumentFolder,
  ModelInvoice,
  ModelInvoicePos,
  ModelPart,
  ModelPaymentMethod,
  ModelSevUser,
  ModelStaticCountry,
  ModelTag,
  ModelTagRelation,
  ModelUnity,
  ModelVoucher,
  ModelVoucherPos,
} from "./interfaces.js";
import { SevDeskUrls } from "./urls.js";

const DEFAULT_BASE_URL = "https://my.sevdesk.de/";

type UrlParamsFor<MethodName extends keyof SevDeskUrls> = Parameters<
  Extract<SevDeskUrls[MethodName], (...args: any) => any>
>[0];

export type SevDeskClientConfig = {
  apiKey: string;
  baseUrl?: string;
};

export class SevDeskClient {
  readonly config: Required<SevDeskClientConfig>;

  readonly urls: SevDeskUrls;

  constructor({ apiKey, baseUrl = DEFAULT_BASE_URL }: SevDeskClientConfig) {
    this.config = {
      apiKey,
      baseUrl,
    };
    this.urls = new SevDeskUrls(baseUrl);
  }

  async request<ResponseBody>(
    url: string | URL,
    options: RequestInit & { timeout?: number } = {}
  ) {
    const { apiKey } = this.config;

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, options.timeout ?? 5000);

    let body;

    try {
      const response = await dependencies.fetch(url.toString(), {
        ...options,
        headers: {
          Authorization: apiKey,
          Accept: "application/json",
          ...options.headers,
        },
        signal: controller.signal,
      });

      let error;

      try {
        body = await response.json();
      } catch (err: any) {
        error = err;
      }

      if (body?.error !== undefined) {
        const error = new Error();

        Object.assign(error, body.error);

        throw error;
      }
      if (response.ok === false || error) {
        const message = error?.message ?? body?.error?.message ?? body.message;

        throw new UnknownApiError(message, { response });
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "The user aborted a request."
      ) {
        throw new Error("Request timed out");
      }
    } finally {
      clearTimeout(timeout);
    }

    return body as ResponseBody;
  }

  // -------------------------------------------------------
  // Invoice
  // -------------------------------------------------------

  /**
   * Get an overview of all invoices.
   *
   * @see https://my.sevdesk.de/swaggerUI/index.html#/Invoice/getInvoices
   */
  async getInvoices(params: UrlParamsFor<"apiGetInvoicesUrl"> = {}) {
    const url = this.urls.apiGetInvoicesUrl(params);

    return this.request<{
      total?: number;
      objects: Array<Required<ModelInvoice>>;
    }>(url, { method: "GET" });
  }

  /**
   * Get a single invoice by id
   */
  async getInvoice(params: UrlParamsFor<"apiGetInvoiceUrl">) {
    const url = this.urls.apiGetInvoiceUrl(params);

    return this.request<{
      objects: [Required<ModelInvoice>];
    }>(url, { method: "GET" });
  }

  /**
   * Get the next invoice number
   */
  async getNextInvoiceNumber(
    params: UrlParamsFor<"apiGetNextInvoiceNumberUrl">
  ) {
    const url = this.urls.apiGetNextInvoiceNumberUrl(params);

    return this.request<{
      objects: string;
    }>(url, { method: "GET" });
  }

  /**
   * Create a new invoice
   */
  async saveInvoice(body: unknown) {
    const url = this.urls.apiSaveInvoiceUrl();

    return this.request<{
      objects: {
        invoice: Required<ModelInvoice>;
        invoicePos: Array<Required<ModelInvoicePos>>;
        filename: string;
      };
    }>(url, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
  }

  /**
   * Update an existing invoice
   */
  async updateInvoice(invoice: ModelInvoice) {
    if (!invoice.id) throw new Error("id is required");
    const url = this.urls.apiUpdateInvoiceUrl({ id: invoice.id });

    return this.request<{
      objects: Required<ModelInvoice>;
    }>(url, {
      method: "PUT",
      body: JSON.stringify(invoice),
      headers: { "Content-Type": "application/json" },
    });
  }

  /**
   * Render a single invoice by id
   */
  async renderInvoice(params: UrlParamsFor<"apiRenderInvoiceUrl">) {
    const url = this.urls.apiRenderInvoiceUrl(params);

    return this.request(url, { method: "POST" });
  }

  /**
   * Delete a single invoice by id
   */
  async deleteInvoice(params: UrlParamsFor<"apiDeleteInvoiceUrl">) {
    const url = this.urls.apiDeleteInvoiceUrl(params);

    return this.request<{
      objects: [null];
    }>(url, { method: "DELETE" });
  }

  /**
   * Cancel a single invoice by id
   */
  async cancelInvoice(params: UrlParamsFor<"apiCancelInvoiceUrl">) {
    const url = this.urls.apiCancelInvoiceUrl(params);

    return this.request<{ objects: Required<ModelInvoice> }>(url, {
      method: "POST",
    });
  }

  /**
   * Mark a single invoice as sent
   */
  async markInvoiceAsSent(
    params: UrlParamsFor<"apiInvoiceSendByUrl">,
    sendType: string,
    sendDraft: boolean
  ) {
    const url = this.urls.apiInvoiceSendByUrl(params);

    return this.request<{
      objects: Required<ModelInvoice>;
    }>(url, {
      method: "PUT",
      body: JSON.stringify({ sendType, sendDraft }),
      headers: { "Content-Type": "application/json" },
    });
  }

  /**
   * Get an xml object from invoice
   */
  async getInvoiceXml(params: UrlParamsFor<"apiGetInvoiceXmlUrl">) {
    const url = this.urls.apiGetInvoiceXmlUrl(params);

    return this.request<{ objects: string }>(url, {
      method: "GET",
    });
  }

  /**
   * Get an overview of all invoices based on tagIds
   */
  async getInvoicesWithTags(tagIds: Array<string>) {
    const queryParams = tagIds.reduce<Record<string, string>>(
      (params, tagId, index) => {
        params[`tags[${index}][id]`] = tagId;
        params[`tags[${index}][objectName]`] = "Tag";

        return params;
      },
      {}
    );

    // Fetch invoices from SevDesk API
    return this.getInvoices(queryParams);
  }

  // -------------------------------------------------------
  // Credit Note
  // -------------------------------------------------------

  /**
   * Get an overview of all credit notes
   */
  async getCreditNotes(params: UrlParamsFor<"apiGetCreditNotesUrl"> = {}) {
    const url = this.urls.apiGetCreditNotesUrl(params);

    return this.request<{
      total?: number;
      objects: Array<Required<ModelCreditNote>>;
    }>(url, { method: "GET" });
  }

  /**
   * Get a single credit note by id
   */
  async getCreditNote(params: UrlParamsFor<"apiGetCreditNoteUrl">) {
    const url = this.urls.apiGetCreditNoteUrl(params);

    return this.request<{
      objects: [Required<ModelCreditNote>];
    }>(url, { method: "GET" });
  }

  /**
   * Get the next credit note number
   */
  async getNextCreditNoteNumber(
    params: UrlParamsFor<"apiGetNextCreditNoteNumberUrl">
  ) {
    const url = this.urls.apiGetNextCreditNoteNumberUrl(params);

    return this.request<{
      objects: string;
    }>(url, { method: "GET" });
  }

  /**
   * Create a new credit note
   */
  async saveCreditNote(body: unknown) {
    const url = this.urls.apiSaveCreditNoteUrl();

    return this.request<{
      objects: {
        creditNote: Required<ModelCreditNote>;
        creditNotePos: Array<Required<ModelCreditNotePos>>;
      };
    }>(url, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
  }

  /**
   * Update an existing credit note
   */
  async updateCreditNote(creditNote: ModelCreditNote) {
    if (!creditNote.id) throw new Error("id is required");
    const url = this.urls.apiUpdateCreditNoteUrl({ id: creditNote.id });

    return this.request<{
      objects: Required<ModelCreditNote>;
    }>(url, {
      method: "PUT",
      body: JSON.stringify(creditNote),
      headers: { "Content-Type": "application/json" },
    });
  }

  /**
   * Delete a single credit note by id
   */
  async deleteCreditNote(params: UrlParamsFor<"apiDeleteCreditNoteUrl">) {
    const url = this.urls.apiDeleteCreditNoteUrl(params);

    return this.request<{ objects: [null] }>(url, { method: "DELETE" });
  }

  /**
   * Render a single credit note by id
   */
  async renderCreditNote(params: UrlParamsFor<"apiRenderCreditNoteUrl">) {
    const url = this.urls.apiRenderCreditNoteUrl(params);

    return this.request(url, { method: "POST" });
  }

  /**
   * Get an xml object from credit note
   */
  async getCreditNoteXml(params: UrlParamsFor<"apiGetCreditNoteXmlUrl">) {
    const url = this.urls.apiGetCreditNoteXmlUrl(params);

    return this.request<{ objects: string }>(url, {
      method: "GET",
    });
  }

  /**
   * Mark a single credit note as sent
   */
  async markCreditNoteAsSent(
    params: UrlParamsFor<"apiCreditNoteSendByUrl">,
    sendType: string,
    sendDraft: boolean
  ) {
    const url = this.urls.apiCreditNoteSendByUrl(params);

    return this.request<{
      objects: Required<ModelCreditNote>;
    }>(url, {
      method: "PUT",
      body: JSON.stringify({ sendType, sendDraft }),
      headers: { "Content-Type": "application/json" },
    });
  }

  /**
   * Get credit notes with tags
   */
  async getCreditNotesWithTags(tagIds: Array<string>) {
    const queryParams = tagIds.reduce<Record<string, string>>(
      (params, tagId, index) => {
        params[`tags[${index}][id]`] = tagId;
        params[`tags[${index}][objectName]`] = "Tag";

        return params;
      },
      {}
    );

    // Fetch credit notes from SevDesk API
    return this.getCreditNotes(queryParams);
  }

  /**
  // -------------------------------------------------------
  // Voucher
  // -------------------------------------------------------

  /**
   * Get an overview of all vouchers
   *
   * @see https://api.sevdesk.de/#tag/Voucher
   */
  async getVouchers(params: UrlParamsFor<"apiVoucherUrl"> = {}) {
    const url = this.urls.apiVoucherUrl(params);

    return this.request<{
      total?: number;
      objects: Array<Required<ModelVoucher>>;
    }>(url, { method: "GET" });
  }

  // -------------------------------------------------------
  // VoucherPos
  // -------------------------------------------------------

  /**
   * Get an overview of all voucher positions
   *
   * @see https://api.sevdesk.de/#tag/VoucherPos
   */
  async getVoucherPositions(params: UrlParamsFor<"apiVoucherPosUrl"> = {}) {
    const url = this.urls.apiVoucherPosUrl(params);

    return this.request<{
      total?: number;
      objects: Array<Required<ModelVoucherPos>>;
    }>(url, { method: "GET" });
  }

  // -------------------------------------------------------
  // DocumentFolder
  // -------------------------------------------------------

  /**
   * Get an overview of all document folders
   *
   * @see https://my.sevdesk.de/swaggerUI/index.html#/DocumentFolder/getDocumentFolders
   */
  async getDocumentFolders(
    params: UrlParamsFor<"apiGetDocumentFoldersUrl"> = {}
  ) {
    const url = this.urls.apiGetDocumentFoldersUrl(params);

    return this.request<{
      total?: number;
      objects: Array<Required<ModelDocumentFolder>>;
    }>(url, { method: "GET" });
  }

  // -------------------------------------------------------
  // Document
  // -------------------------------------------------------

  /**
   * Get an overview of all documents
   *
   * @see https://my.sevdesk.de/swaggerUI/index.html#/Document/getDocuments
   */
  async getDocuments(params: UrlParamsFor<"apiGetDocumentsUrl"> = {}) {
    const url = this.urls.apiGetDocumentsUrl(params);

    return this.request<{
      total?: number;
      objects: Array<Required<ModelDocument>>;
    }>(url, {
      method: "GET",
    });
  }

  /**
   * Upload a file (creating a document)
   *
   * @see https://my.sevdesk.de/swaggerUI/index.html#/Document/FactoryAddDocument
   */
  async addDocument({
    file,
    ...query
  }: UrlParamsFor<"apiFileUploadUrl"> & {
    file:
      | Parameters<FormData["append"]>[1]
      | Parameters<NodeFormData["append"]>[1];
  }) {
    const url = this.urls.apiFileUploadUrl(query);
    const form = new dependencies.FormData();

    form.append("files", file);

    return this.request<{ objects: [Required<ModelDocument>] }>(url, {
      method: "POST",
      body: form,
    });
  }

  // -------------------------------------------------------
  // Contact
  // -------------------------------------------------------

  /**
   * Get a single contact by id
   */
  async getContact(params: UrlParamsFor<"apiGetContactUrl">) {
    const url = this.urls.apiGetContactUrl(params);

    return this.request<{ objects: [Required<ModelContact>] }>(url, {
      method: "GET",
    });
  }

  /**
   * Create a new contact
   */
  async createContact(body: ModelContact) {
    const url = this.urls.apiCreateContactUrl();

    return this.request<{
      objects: Required<ModelContact>;
    }>(url, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
  }

  /**
   * Update an existing contact
   */
  async updateContact(contact: ModelContact) {
    if (!contact.id) throw new Error("id is required");
    const url = this.urls.apiUpdateContactUrl({ id: contact.id });

    return this.request<{
      objects: Required<ModelContact>;
    }>(url, {
      method: "PUT",
      body: JSON.stringify(contact),
      headers: { "Content-Type": "application/json" },
    });
  }

  /**
   * Get an overview of all contacts
   *
   * @see https://my.sevdesk.de/swaggerUI/index.html#/Contact/getContacts
   */
  async getContacts(params: UrlParamsFor<"apiGetContactsUrl"> = {}) {
    const url = this.urls.apiGetContactsUrl(params);

    return this.request<{
      total?: number;
      objects: Array<Required<ModelContact>>;
    }>(url, {
      method: "GET",
    });
  }

  /**
   * Get an overview of all contacts based on tagIds
   *
   */
  async getContactsWithTags(tagIds: Array<string>) {
    const queryParams = tagIds.reduce<Record<string, string>>(
      (params, tagId, index) => {
        params[`tags[${index}][id]`] = tagId;
        params[`tags[${index}][objectName]`] = "Tag";

        return params;
      },
      {}
    );

    // Fetch contacts from SevDesk API
    return this.getContacts(queryParams);
  }

  // -------------------------------------------------------
  // ContactAddress
  // -------------------------------------------------------

  /**
   * Create a new contact address
   */
  async createContactAddress(body: ModelContactAddress) {
    const url = this.urls.apiCreateContactAddressUrl();

    return this.request<{
      objects: Required<ModelContactAddress>;
    }>(url, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
  }

  /**
   * Update an existing contact address
   */
  async updateContactAddress(address: ModelContactAddress) {
    if (!address.id) throw new Error("id is required");
    const url = this.urls.apiUpdateContactAddressUrl({ id: address.id });

    return this.request<{
      objects: Required<ModelContactAddress>;
    }>(url, {
      method: "PUT",
      body: JSON.stringify(address),
      headers: { "Content-Type": "application/json" },
    });
  }

  /**
   * Get an overview of all contact addresses
   */
  async getContactAddresses(
    params: UrlParamsFor<"apiGetContactAddressesUrl"> = {}
  ) {
    const url = this.urls.apiGetContactAddressesUrl(params);

    return this.request<{
      total?: number;
      objects: Array<Required<ModelContactAddress>>;
    }>(url, {
      method: "GET",
    });
  }

  // -------------------------------------------------------
  // CommunicationWay
  // -------------------------------------------------------

  /**
   * Create a new communication way
   */
  async createCommunicationWay(body: ModelCommunicationWay) {
    const url = this.urls.apiCreateCommunicationWayUrl();

    return this.request<{
      objects: Required<ModelCommunicationWay>;
    }>(url, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
  }

  /**
   * Update an existing communication way
   */
  async updateCommunicationWay(communicationWay: ModelCommunicationWay) {
    if (!communicationWay.id) throw new Error("id is required");
    const url = this.urls.apiUpdateCommunicationWayUrl({
      id: communicationWay.id,
    });

    return this.request<{
      objects: Required<ModelCommunicationWay>;
    }>(url, {
      method: "PUT",
      body: JSON.stringify(communicationWay),
      headers: { "Content-Type": "application/json" },
    });
  }

  /**
   * Delete a communication way
   */
  async deleteCommunicationWay(
    params: UrlParamsFor<"apiDeleteCommunicationWayUrl">
  ) {
    const url = this.urls.apiDeleteCommunicationWayUrl(params);

    return this.request<{
      objects: [null];
    }>(url, { method: "DELETE" });
  }

  /**
   * Get an overview of all communication ways
   *
   * @see https://my.sevdesk.de/swaggerUI/index.html#/CommunicationWay/getCommunicationWays
   */
  async getCommunicationWays(
    params: UrlParamsFor<"apiGetCommunicationWaysUrl"> = {}
  ) {
    const url = this.urls.apiGetCommunicationWaysUrl(params);

    return this.request<{
      total?: number;
      objects: Array<Required<ModelCommunicationWay>>;
    }>(url, {
      method: "GET",
    });
  }

  // -------------------------------------------------------
  // Unity
  // -------------------------------------------------------

  /**
   * Get an overview of all unities
   *
   * @see https://my.sevdesk.de/swaggerUI/index.html#/Unity/getUnities
   */
  async getUnities(params: UrlParamsFor<"apiGetUnitiesUrl"> = {}) {
    const url = this.urls.apiGetUnitiesUrl(params);

    return this.request<{
      total?: number;
      objects: Array<Required<ModelUnity>>;
    }>(url, {
      method: "GET",
    });
  }

  // -------------------------------------------------------
  // PaymentMethod
  // -------------------------------------------------------

  /**
   * Get an overview of all payment methods
   */
  async getPaymentMethods(
    params: UrlParamsFor<"apiGetPaymentMethodsUrl"> = {}
  ) {
    const url = this.urls.apiGetPaymentMethodsUrl(params);

    return this.request<{
      total?: number;
      objects: Array<Required<ModelPaymentMethod>>;
    }>(url, {
      method: "GET",
    });
  }

  // -------------------------------------------------------
  // Tag
  // -------------------------------------------------------

  /**
   * Get an overview of all tags
   */
  async getTags(params: UrlParamsFor<"apiGetTagsUrl"> = {}) {
    const url = this.urls.apiGetTagsUrl(params);

    return this.request<{ total?: number; objects: Array<Required<ModelTag>> }>(
      url,
      {
        method: "GET",
      }
    );
  }

  /**
   * Get a tag by name
   */

  async getTagWithName(name: string) {
    const url = this.urls.apiGetTagsUrl({ nameStartsWith: name });
    const result = await this.request<{
      total?: number;
      objects: Array<Required<ModelTag>>;
    }>(url, {
      method: "GET",
    });

    const tag = result.objects.find((tag) => tag.name === name);

    return tag;
  }

  /**
   * Create a new tag
   */
  async createTag(name: string, object: { id: number; objectName: string }) {
    const url = this.urls.apiCreateTagUrl();

    return this.request<{ objects: Required<ModelTagRelation> }>(url, {
      method: "POST",
      body: JSON.stringify({ name, object }),
      headers: { "Content-Type": "application/json" },
    });
  }

  // -------------------------------------------------------
  // SevUser
  // -------------------------------------------------------

  /**
   * Get an overview of all users
   */
  async getSevUsers(params: UrlParamsFor<"apiGetSevUsersUrl"> = {}) {
    const url = this.urls.apiGetSevUsersUrl(params);

    return this.request<{
      total?: number;
      objects: Array<Required<ModelSevUser>>;
    }>(url, {
      method: "GET",
    });
  }

  // -------------------------------------------------------
  // StaticCountry
  // -------------------------------------------------------

  /**
   * Get an overview of all static countries
   */
  async getStaticCountries(
    params: UrlParamsFor<"apiGetStaticCountriesUrl"> = {}
  ) {
    const url = this.urls.apiGetStaticCountriesUrl(params);

    return this.request<{
      total?: number;
      objects: Array<Required<ModelStaticCountry>>;
    }>(url, {
      method: "GET",
    });
  }

  // -------------------------------------------------------
  // Part
  // -------------------------------------------------------

  /**
   * Get an overview of all parts
   */
  async getParts(params: UrlParamsFor<"apiGetPartsUrl"> = {}) {
    const url = this.urls.apiGetPartsUrl(params);

    return this.request<{
      total?: number;
      objects: Array<Required<ModelPart>>;
    }>(url, {
      method: "GET",
    });
  }

  // // pending invoices from sevdesk includes also outstanding / due invoices
  // // we remove them with a filter but you could also include the if you only need everything pending
  // async getPendingInvoices(options = { includeOutstanding: false }) {
  //   const allPendingInvoices = await this.getAllInvoices({
  //     status: "200",
  //   });

  //   return options.includeOutstanding
  //     ? allPendingInvoices
  //     : allPendingInvoices.filter(({ invoiceDate, timeToPay }) =>
  //         isBefore(
  //           Date.now(),
  //           addDays(new Date(invoiceDate), Number(timeToPay))
  //         )
  //       );
  // }

  // async getOutstandingInvoices() {
  //   const pendingInvoice = await this.getPendingInvoices({
  //     includeOutstanding: true,
  //   });

  //   return pendingInvoice.filter(({ invoiceDate, timeToPay }) =>
  //     isAfter(Date.now(), addDays(new Date(invoiceDate), Number(timeToPay)))
  //   );
  // }

  // async getBilledAmount(orderId) {
  //   const invoices = await this.getAllInvoices();

  //   return invoices
  //     .filter((invoice) => {
  //       return (
  //         invoice.origin !== undefined &&
  //         invoice.origin.id === orderId.toString()
  //       );
  //     })
  //     .reduce((sum, { sumNet }) => {
  //       sum += parseInt(sumNet);

  //       return sum;
  //     }, 0);
  // }

  // async getOrderTotalNet(orderId) {
  //   const options = {
  //     method: "GET",
  //   };

  //   return this.request(
  //     `https://my.sevdesk.de/api/v1/Order/${orderId}/getTotalNet`,
  //     options
  //   );
  // }

  // async getRemainingOrderBudget(orderId) {
  //   const totalNet = await this.getOrderTotalNet(orderId);
  //   const alreadyBilledAmount = await this.getBilledAmount(orderId);

  //   return totalNet - alreadyBilledAmount;
  // }

  // async getTextTemplates(language = "DE") {
  //   const options = {
  //     method: "GET",
  //   };

  //   const templates = await this.request(
  //     "https://my.sevdesk.de/api/v1/TextTemplate",
  //     options
  //   );

  //   const textTemplates = {
  //     DE: {
  //       RE: {
  //         HEAD: null,
  //         FOOT: null,
  //       },
  //     },
  //     EN: {
  //       RE: {
  //         HEAD: null,
  //         FOOT: null,
  //       },
  //     },
  //   };

  //   templates
  //     // TODO remove filter and add english templates for Offer, E-mail, etc. (https://my.sevdesk.de/#/admin/texttemplate)
  //     .filter((template) => template.objectType === "RE")
  //     .forEach((template) => {
  //       const { objectType, textType, name, text } = template;

  //       textTemplates[name === "Standard" ? "DE" : "EN"][objectType][textType] =
  //         text;
  //     });

  //   return textTemplates[language];
  // }

  // -------------------------------------------------------
  // Tools
  // -------------------------------------------------------

  /**
   * Get the bookkeeping system version
   */
  async getBookkeepingSystemVersion() {
    const url = this.urls.apiGetBookkeepingSystemVersionUrl();

    return this.request<{
      objects: Required<ModelBookkeepingSystemVersion>;
    }>(url, { method: "GET" });
  }
}
