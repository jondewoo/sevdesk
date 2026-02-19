import "./tests/setup.js";
import * as fs from "fs";
import { test } from "uvu";
import * as assert from "uvu/assert";
import { SevDeskClient } from "./client.js";
import * as env from "./tests/env.js";
import { dependencies } from "./dependencies.js";
import { RateLimitError, UnknownApiError } from "./errors.js";
import {
  ModelBookkeepingSystemVersion,
  ModelCommunicationWay,
  ModelContact,
  ModelContactAddress,
  ModelCreditNote,
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

let sevDeskClient: SevDeskClient;

test.before.each(() => {
  sevDeskClient = new SevDeskClient({
    apiKey: env.TEST_SEVDESK_API_TOKEN,
  });
});

test("Get invoices", async () => {
  const { objects: invoices } = await sevDeskClient.getInvoices();

  assert.is(invoices.length > 0, true);
  invoices.forEach(assertIsInvoice);

  const [firstInvoice] = invoices;

  const {
    objects: [invoice],
  } = await sevDeskClient.getInvoice({ id: firstInvoice.id });

  assertIsInvoice(invoice);
});

test("Get invoice positions", async () => {
  const { objects: invoices } = await sevDeskClient.getInvoices();

  assert.is(invoices.length > 0, true);

  const [firstInvoice] = invoices;
  const { objects: positions, total } = await sevDeskClient.getInvoicePositions(
    {
      id: firstInvoice.id,
    }
  );

  assert.is(Array.isArray(positions), true);
  positions.forEach(assertIsInvoicePos);
  if (total !== undefined) {
    assert.type(total, "number");
  }
});

test.skip("Get invoices with multiple tags", async () => {
  const tagIds = ["123456", "45678"];

  const { objects: invoices } = await sevDeskClient.getInvoicesWithTags(tagIds);

  assert.is(Array.isArray(invoices), true, "Should return an array");

  invoices.forEach(assertIsInvoice);
});

test("Get next invoice number", async () => {
  const { objects: nextInvoiceNumber } =
    await sevDeskClient.getNextInvoiceNumber({
      invoiceType: "RE",
      useNextNumber: false,
    });

  assert.type(nextInvoiceNumber, "string");
});

// Manual test
// If you run this test, you need to clean up manually afterwards
test.skip("Create a new invoice", async () => {
  const contactId = 123;
  const contactPersonId = 123;
  const invoiceNumber = `TEST-${new Date().toISOString()}`;

  const {
    objects: { invoice },
  } = await sevDeskClient.saveInvoice({
    invoice: {
      objectName: "Invoice",
      invoiceNumber,
      contact: {
        id: contactId,
        objectName: "Contact",
      },
      contactPerson: {
        id: contactPersonId,
        objectName: "SevUser",
      },
      invoiceDate: "01.01.2022",
      header: `Invoice ${invoiceNumber}`,
      headText: "header information",
      footText: "footer information",
      timeToPay: 20,
      discount: 0,
      address: "name\nstreet\npostCode city",
      addressCountry: {
        id: 1,
        objectName: "StaticCountry",
      },
      payDate: "2019-08-24T14:15:22Z",
      deliveryDate: "01.01.2022",
      deliveryDateUntil: null,
      status: "100",
      smallSettlement: 0,
      taxRate: 0,
      taxRule: {
        id: "1",
        objectName: "TaxRule",
      },
      taxText: "Umsatzsteuer 19%",
      taxType: "default",
      taxSet: null,
      paymentMethod: {
        id: 21919,
        objectName: "PaymentMethod",
      },
      sendDate: "01.01.2020",
      invoiceType: "RE",
      currency: "EUR",
      showNet: "1",
      sendType: "VPR",
      origin: null,
      customerInternalNote: null,
      propertyIsEInvoice: false,
      mapAll: true,
    },
    invoicePosSave: [
      {
        id: null,
        objectName: "InvoicePos",
        mapAll: true,
        quantity: 1,
        price: 100,
        name: "Dragonglass",
        unity: {
          id: 1,
          objectName: "Unity",
        },
        positionNumber: 0,
        text: "string",
        discount: 0.1,
        taxRate: 19,
        priceGross: 100,
        priceTax: 0.1,
      },
    ],
    invoicePosDelete: null,
    filename: "string",
    discountSave: [
      {
        discount: "true",
        text: "string",
        percentage: true,
        value: 0,
        objectName: "Discounts",
        mapAll: "true",
      },
    ],
    discountDelete: null,
  });

  assertIsInvoice(invoice);
});

// Manual test
// If you run this test, you need to clean up manually afterwards
test.skip("Update an existing invoice", async () => {
  const invoiceId = "123";
  const invoiceNumber = `TEST-${new Date().toISOString()}`;

  const response = await sevDeskClient.updateInvoice({
    id: invoiceId,
    objectName: "Invoice",
    header: invoiceNumber,
    invoiceNumber,
  });

  const { objects: invoice } = response;

  assertIsInvoice(invoice);
  assert.equal(invoice.id, invoiceId, "Invoice IDs should match");
  assert.equal(invoice.header, invoiceNumber, "Invoice header should match");
  assert.equal(
    invoice.invoiceNumber,
    invoiceNumber,
    "Invoice numbers should match"
  );
});

// Manual test
// If you run this test, you need to clean up manually afterwards
test.skip("Render invoice", async () => {
  const invoiceId = "123";

  await sevDeskClient.renderInvoice({
    id: invoiceId,
  });
});

// Manual test
// If you run this test, you need to clean up manually afterwards
test.skip("Delete invoice", async () => {
  const invoiceId = "123";

  await sevDeskClient.deleteInvoice({ id: invoiceId });
});

test.skip("Cancel invoice", async () => {
  const invoiceId = "123";

  const { objects: invoice } = await sevDeskClient.cancelInvoice({
    id: invoiceId,
  });

  assertIsInvoice(invoice);
});

// Manual test
// If you run this test, you need to clean up manually afterwards
test.skip("Mark invoice as sent", async () => {
  const invoiceId = "123";

  const { objects: invoice } = await sevDeskClient.markInvoiceAsSent(
    { id: invoiceId },
    "VM",
    false
  );

  assertIsInvoice(invoice);
});

test.skip("Get invoice XML", async () => {
  const invoiceId = "123456";

  const { objects } = await sevDeskClient.getInvoiceXml({
    id: invoiceId,
  });

  assert.is(typeof objects, "string");
  assert.is(objects.length > 0, true);
});

test("Get credit notes", async () => {
  const { objects: creditNotes } = await sevDeskClient.getCreditNotes();

  assert.is(creditNotes.length > 0, true);
  creditNotes.forEach(assertIsCreditNote);

  const [firstCreditNote] = creditNotes;

  const { objects: creditNote } = await sevDeskClient.getCreditNote({
    id: firstCreditNote.id,
  });

  assertIsCreditNote(creditNote[0]);
});

test("Get next credit note number", async () => {
  const { objects: nextCreditNoteNumber } =
    await sevDeskClient.getNextCreditNoteNumber({
      creditNoteType: "CN",
      useNextNumber: false,
    });

  assert.type(nextCreditNoteNumber, "string");
});

test.skip("Create a new credit note", async () => {
  const contactId = 123456;
  const contactPersonId = 123456;
  const creditNoteNumber = `TEST-${new Date().toISOString()}`;

  const {
    objects: { creditNote },
  } = await sevDeskClient.saveCreditNote({
    creditNote: {
      objectName: "CreditNote",
      creditNoteNumber,
      contact: {
        id: contactId,
        objectName: "Contact",
      },
      creditNoteDate: "01.01.2022",
      header: "Credit Note",
      headText: "header information",
      footText: "footer information",
      addressName: "name\nstreet\npostCode city",
      addressCountry: {
        id: "1",
        objectName: "StaticCountry",
      },
      deliveryDate: "2025-07-28T00:00:00+02:00",
      status: "100",
      contactPerson: {
        id: contactPersonId,
        objectName: "SevUser",
      },
      address: "some street\n12345 some city",
      paymentMethod: {
        id: "21919",
        objectName: "PaymentMethod",
      },
      bookingCategory: "PROVISION",
      addressStreet: "some street",
      addressZip: "12345",
      addressCity: "some city",
      propertyIsEInvoice: true,
      currency: "EUR",
      taxRate: "0",
      taxType: "default",
      taxSet: null,
      mapAll: true,
    },
    creditNotePosSave: [
      {
        objectName: "CreditNotePos",
        quantity: "1",
        price: "100",
        name: "Dragonglass",
        priority: "100",
        unity: {
          id: "1",
          objectName: "Unity",
        },
        taxRate: "19",
        priceGross: "100",
        priceTax: "0.1",
        mapAll: true,
      },
    ],
  });

  console.log(creditNote);

  assertIsCreditNote(creditNote);
});

// Manual test
// If you run this test, you need to clean up manually afterwards
test.skip("Update an existing credit note", async () => {
  const creditNoteId = "123456";
  const creditNoteNumber = `TEST-${new Date().toISOString()}`;

  const response = await sevDeskClient.updateCreditNote({
    id: creditNoteId,
    objectName: "CreditNote",
    header: creditNoteNumber,
    creditNoteNumber,
  });

  const { objects: creditNote } = response;

  console.log(creditNote);

  assertIsCreditNote(creditNote);
  assert.equal(creditNote.id, creditNoteId, "Credit note IDs should match");
  assert.equal(
    creditNote.header,
    creditNoteNumber,
    "Credit note header should match"
  );
  assert.equal(
    creditNote.creditNoteNumber,
    creditNoteNumber,
    "Credit note numbers should match"
  );
});

// Manual test
// If you run this test, you need to clean up manually afterwards
test.skip("Delete a credit note", async () => {
  const creditNoteId = "123456";

  await sevDeskClient.deleteCreditNote({ id: creditNoteId });
});

test.skip("Render a credit note", async () => {
  const creditNoteId = "123456";

  try {
    await sevDeskClient.renderCreditNote({ id: creditNoteId });
  } catch (error) {
    console.error(error);
  }
});

test.skip("Get credit note XML", async () => {
  const creditNoteId = "123456";

  const { objects } = await sevDeskClient.getCreditNoteXml({
    id: creditNoteId,
  });

  console.log(objects);

  assert.is(typeof objects, "string");
  assert.is(objects.length > 0, true);
});

test.skip("Get credit notes with tags", async () => {
  const tagIds = ["123456", "45678"];

  const { objects: creditNotes } = await sevDeskClient.getCreditNotesWithTags(
    tagIds
  );

  console.log(creditNotes);

  assert.is(Array.isArray(creditNotes), true, "Should return an array");

  creditNotes.forEach(assertIsCreditNote);
});

// Manual test
// If you run this test, you need to clean up manually afterwards
test.skip("Mark credit note as sent", async () => {
  const creditNoteId = "123456";

  const { objects: creditNote } = await sevDeskClient.markCreditNoteAsSent(
    { id: creditNoteId },
    "VM",
    false
  );

  assertIsCreditNote(creditNote);
});
test.skip("Get vouchers", async () => {
  const { objects: vouchers } = await sevDeskClient.getVouchers();

  assert.is(vouchers.length > 0, true);
  vouchers.forEach(assertIsVoucher);
});

test.skip("Get voucher positions", async () => {
  const voucherId = 123456789;
  const { objects: voucherPositions } = await sevDeskClient.getVoucherPositions(
    { voucherId }
  );

  assert.is(voucherPositions.length > 0, true);
  voucherPositions.forEach(assertIsVoucherPos);
});

test("Get document folders", async () => {
  const { objects: documentFolders } = await sevDeskClient.getDocumentFolders();

  assert.is(documentFolders.length > 0, true);
  documentFolders.forEach(assertIsDocumentFolder);
});

test("Get documents", async () => {
  const { objects: documents } = await sevDeskClient.getDocuments();

  assert.is(documents.length > 0, true);
  documents.forEach(assertIsDocument);
});

// Manual test
// If you run this test, you need to clean up manually afterwards
test.skip("Add document", async () => {
  const {
    objects: [document],
  } = await sevDeskClient.addDocument({
    file: fs.createReadStream("./package.json"),
  });

  assertIsDocument(document);
});

test.skip("Get contact", async () => {
  const contactId = "123456789";
  const {
    objects: [contact],
  } = await sevDeskClient.getContact({
    id: contactId,
  });

  assertIsContact(contact);
});

// Manual test
// If you run this test, you need to clean up manually afterwards
test.skip("Create a new contact", async () => {
  const { objects: contact } = await sevDeskClient.createContact({
    name: "New Test Contact",
    category: {
      id: "3",
      objectName: "Category",
    },
  });

  assertIsContact(contact);
});

// Manual test
// If you run this test, you need to clean up manually afterwards
test.skip("Update an existing contact", async () => {
  const { objects: contact } = await sevDeskClient.updateContact({
    id: "123456789",
    name: "Updated Test Contact",
  });

  assertIsContact(contact);
});

test("Get contacts", async () => {
  const { objects: contacts } = await sevDeskClient.getContacts();

  assert.is(contacts.length > 0, true);
  contacts.forEach(assertIsContact);
});

// Manual test
// If you run this test, you need to clean up manually afterwards
test.skip("Create a new contact address", async () => {
  const { objects: contactAddress } = await sevDeskClient.createContactAddress({
    contact: { id: "123456789", objectName: "Contact" },
    street: "123 Main St",
    zip: "12345",
    city: "Anytown",
    name: "Warehouse",
    country: {
      id: "1",
      objectName: "StaticCountry",
    },
    category: {
      id: "47",
      objectName: "Category",
    },
  });

  assertIsContactAddress(contactAddress);
});

// Manual test
// If you run this test, you need to clean up manually afterwards
test.skip("Update an existing contact address", async () => {
  const { objects: contactAddress } = await sevDeskClient.updateContactAddress({
    id: "123456789",
    street: "456 Second Ave",
    zip: "67890",
    city: "Otherville",
    name: "New Warehouse",
    country: {
      id: "1",
      objectName: "StaticCountry",
    },
    category: {
      id: "47",
      objectName: "Category",
    },
  });

  assertIsContactAddress(contactAddress);
});

test("Get contact addresses (without contact ID)", async () => {
  const { objects: contactAddresses } =
    await sevDeskClient.getContactAddresses();

  assert.is(contactAddresses.length > 0, true);
  contactAddresses.forEach(assertIsContactAddress);
});

test("Get contact addresses (with contact ID)", async () => {
  const { objects: contacts } = await sevDeskClient.getContacts();
  const { objects: contactAddresses } = await sevDeskClient.getContactAddresses(
    { contactId: contacts[0].id }
  );

  assert.is(contactAddresses.length > 0, true);
  contactAddresses.forEach(assertIsContactAddress);
});

test.skip("Get contacts with multiple tags", async () => {
  const tagIds = ["123456", "45678"];

  const { objects: contacts } = await sevDeskClient.getContactsWithTags(tagIds);

  assert.is(Array.isArray(contacts), true, "Should return an array");

  contacts.forEach(assertIsContact);
});

// Manual test
// If you run this test, you need to clean up manually afterwards
test.skip("Create a new communication way", async () => {
  const { objects: communicationWay } =
    await sevDeskClient.createCommunicationWay({
      contact: {
        id: "123456789",
        objectName: "Contact",
      },
      type: ModelCommunicationWay.TypeEnum.EMAIL,
      value: "test@example.com",
      key: {
        id: "8",
        objectName: "CommunicationWayKey",
      },
    });

  assertIsCommunicationWay(communicationWay);
});

// Manual test
// If you run this test, you need to clean up manually afterwards
test.skip("Update an existing communication way", async () => {
  const communicationWayId = "123456789";
  const { objects: communicationWay } =
    await sevDeskClient.updateCommunicationWay({
      id: communicationWayId,
      value: "updated@example.com",
    });

  assertIsCommunicationWay(communicationWay);
});

// Manual test
// If you run this test, you need to clean up manually afterwards
test.skip("Delete communication way", async () => {
  const communicationWayId = "123456789";

  await sevDeskClient.deleteCommunicationWay({ id: communicationWayId });
});

test("Get communication ways", async () => {
  const { objects: communicationWays } =
    await sevDeskClient.getCommunicationWays();

  assert.is(communicationWays.length > 0, true);
  communicationWays.forEach(assertIsCommunicationWay);
});

test("Get unities", async () => {
  const { objects: unities } = await sevDeskClient.getUnities();

  assert.is(unities.length > 0, true);
  unities.forEach(assertIsUnity);
});

test("Get payment methods", async () => {
  const { objects: paymentMethods } = await sevDeskClient.getPaymentMethods();

  assert.is(paymentMethods.length > 0, true);
  paymentMethods.forEach(assertIsPaymentMethod);
});

test("Get tags", async () => {
  const { objects: tags } = await sevDeskClient.getTags();

  assert.is(tags.length > 0, true);
  tags.forEach(assertIsTag);
});

test.skip("Get tag with name", async () => {
  const tag = await sevDeskClient.getTagWithName("NewTag");

  assert.is(tag, undefined);
  assertIsTag(tag!);
});

// Manual test
// If you run this test, you need to clean up manually afterwards
test.skip("Create a new tag", async () => {
  const { objects: relation } = await sevDeskClient.createTag("NewTag", {
    id: 123,
    objectName: "Contact",
  });

  assertIsTagRelation(relation);
});

test("Get users", async () => {
  const { objects: users } = await sevDeskClient.getSevUsers();

  assert.is(users.length > 0, true);
  users.forEach(assertIsSevUser);
});

test("Get static countries", async () => {
  const { objects: countries } = await sevDeskClient.getStaticCountries();

  assert.is(countries.length > 0, true);
  countries.forEach(assertIsStaticCountry);
});

test("Get parts", async () => {
  const { objects: parts } = await sevDeskClient.getParts();

  assert.is(parts.length > 0, true);
  parts.forEach(assertIsPart);
});

test("Get bookkeeping system version", async () => {
  const { objects: version } =
    await sevDeskClient.getBookkeepingSystemVersion();

  assertIsBookkeepingSystemVersion(version);
});

// -------------------------------------------------------
// Unit tests for SevDeskClient.request method
// -------------------------------------------------------

test("request: successful response with JSON body", async () => {
  const mockFetch = async () => {
    return {
      ok: true,
      json: async () => ({ objects: [{ id: "123", name: "Test" }] }),
    };
  };

  const originalFetch = dependencies.fetch;

  dependencies.fetch = mockFetch as any;

  try {
    const client = new SevDeskClient({ apiKey: "test-key" });
    const result = await client.request<{
      objects: Array<{ id: string; name: string }>;
    }>("https://example.com/api");

    assert.is(result.objects.length, 1);
    assert.is(result.objects[0].id, "123");
    assert.is(result.objects[0].name, "Test");
  } finally {
    dependencies.fetch = originalFetch;
  }
});

test("request: successful response with empty object", async () => {
  const mockFetch = async () => {
    return {
      ok: true,
      json: async () => ({}),
    };
  };

  const originalFetch = dependencies.fetch;

  dependencies.fetch = mockFetch as any;

  try {
    const client = new SevDeskClient({ apiKey: "test-key" });
    const result = await client.request<Record<string, never>>(
      "https://example.com/api"
    );

    assert.is(typeof result, "object");
    assert.is(Object.keys(result).length, 0);
  } finally {
    dependencies.fetch = originalFetch;
  }
});

test("request: throws UnknownApiError when response.ok is false", async () => {
  const mockFetch = async () => {
    return {
      ok: false,
      status: 404,
      statusText: "Not Found",
      text: async () => JSON.stringify({ message: "Resource not found" }),
      headers: {
        forEach: (fn: (value: string, key: string) => void) => {
          fn("application/json", "content-type");
        },
      },
    };
  };

  const originalFetch = dependencies.fetch;

  dependencies.fetch = mockFetch as any;

  try {
    const client = new SevDeskClient({ apiKey: "test-key" });

    await client.request("https://example.com/api");

    assert.unreachable("Should have thrown an error");
  } catch (error) {
    assert.instance(error, UnknownApiError);
    assert.is((error as UnknownApiError).message, "Resource not found");
    assert.is((error as UnknownApiError).response.ok, false);
    assert.is((error as UnknownApiError).status, 404);
    assert.is((error as UnknownApiError).statusText, "Not Found");
    assert.ok((error as UnknownApiError).responseBody);
    assert.is(
      ((error as UnknownApiError).responseBody as { message: string } | null)
        ?.message,
      "Resource not found"
    );
  } finally {
    dependencies.fetch = originalFetch;
  }
});

test("request: throws error when response contains error object", async () => {
  const mockFetch = async () => {
    return {
      ok: true,
      json: async () => ({
        error: {
          message: "API error occurred",
          code: "API_ERROR",
        },
      }),
    };
  };

  const originalFetch = dependencies.fetch;

  dependencies.fetch = mockFetch as any;

  try {
    const client = new SevDeskClient({ apiKey: "test-key" });

    await client.request("https://example.com/api");

    assert.unreachable("Should have thrown an error");
  } catch (error) {
    assert.instance(error, Error);
    assert.is((error as Error).message, "API error occurred");
  } finally {
    dependencies.fetch = originalFetch;
  }
});

test("request: throws UnknownApiError when JSON parsing fails", async () => {
  const mockFetch = async () => {
    return {
      ok: true,
      json: async () => {
        throw new Error("Unexpected token < in JSON at position 0");
      },
    };
  };

  const originalFetch = dependencies.fetch;

  dependencies.fetch = mockFetch as any;

  try {
    const client = new SevDeskClient({ apiKey: "test-key" });

    await client.request("https://example.com/api");

    assert.unreachable("Should have thrown an error");
  } catch (error) {
    assert.instance(error, UnknownApiError);
    assert.is(
      (error as UnknownApiError).message,
      "Unexpected token < in JSON at position 0"
    );
  } finally {
    dependencies.fetch = originalFetch;
  }
});

test("request: throws UnknownApiError when response.ok is false and body is non-JSON", async () => {
  const mockFetch = async () => {
    return {
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: async () => "<html>Error page</html>",
      headers: {
        forEach: (_fn: (value: string, key: string) => void) => {},
      },
    };
  };

  const originalFetch = dependencies.fetch;

  dependencies.fetch = mockFetch as any;

  try {
    const client = new SevDeskClient({ apiKey: "test-key" });

    await client.request("https://example.com/api");

    assert.unreachable("Should have thrown an error");
  } catch (error) {
    assert.instance(error, UnknownApiError);
    assert.is((error as UnknownApiError).message, "Unknown API error (500)");
    assert.is((error as UnknownApiError).status, 500);
    assert.is(
      (error as UnknownApiError).responseBody,
      "<html>Error page</html>"
    );
  } finally {
    dependencies.fetch = originalFetch;
  }
});

test("request: throws UnknownApiError with status in message when response.ok is false and body has no message", async () => {
  const mockFetch = async () => {
    return {
      ok: false,
      status: 429,
      statusText: "Too Many Requests",
      text: async () => "{}",
      headers: {
        forEach: (fn: (value: string, key: string) => void) => {
          fn("60", "retry-after");
        },
      },
    };
  };

  const originalFetch = dependencies.fetch;

  dependencies.fetch = mockFetch as any;

  try {
    const client = new SevDeskClient({ apiKey: "test-key" });

    await client.request("https://example.com/api");

    assert.unreachable("Should have thrown an error");
  } catch (error) {
    assert.instance(error, UnknownApiError);
    assert.is((error as UnknownApiError).message, "Unknown API error (429)");
    assert.is((error as UnknownApiError).status, 429);
    assert.is((error as UnknownApiError).statusText, "Too Many Requests");
    assert.is((error as UnknownApiError).headers?.["retry-after"], "60");
    assert.ok((error as UnknownApiError).responseBody);
  } finally {
    dependencies.fetch = originalFetch;
  }
});

test("request: throws RateLimitError when response is 429 with rate limit body", async () => {
  const rateLimitBody = {
    code: "sec_rate_limit_block",
    contact: "security@sevdesk.de",
    reason:
      "You request has been blocked due exceeding the allowed rate limit triggering one of the security solutions protecting sevdesk.",
    recommendation:
      "Check that your requests are not exceeding our rate limit to prevent being blocked indefinetly. If think a higher rate limit is appropriate for you, please contact us.",
  };

  const mockFetch = async () => {
    return {
      ok: false,
      status: 429,
      statusText: "Too Many Requests",
      text: async () => JSON.stringify(rateLimitBody),
      headers: {
        forEach: (fn: (value: string, key: string) => void) => {
          fn("600", "retry-after");
        },
      },
    };
  };

  const originalFetch = dependencies.fetch;

  dependencies.fetch = mockFetch as any;

  try {
    const client = new SevDeskClient({ apiKey: "test-key" });

    await client.request("https://example.com/api");

    assert.unreachable("Should have thrown an error");
  } catch (error) {
    assert.instance(error, RateLimitError);
    assert.instance(error, UnknownApiError);
    assert.is((error as RateLimitError).message, "Unknown API error (429)");
    assert.is((error as RateLimitError).status, 429);
    assert.is((error as RateLimitError).retryAfter, 600);

    const body = (error as RateLimitError).rateLimitBody;

    assert.is(body.code, rateLimitBody.code);
    assert.is(body.contact, rateLimitBody.contact);
    assert.is(body.reason, rateLimitBody.reason);
    assert.is(body.recommendation, rateLimitBody.recommendation);
  } finally {
    dependencies.fetch = originalFetch;
  }
});

test("request: passes AbortSignal.timeout to fetch", async () => {
  let capturedSignal: AbortSignal | undefined;

  const mockFetch = async (_url: string, options?: RequestInit) => {
    capturedSignal = options?.signal as AbortSignal | undefined;

    return {
      ok: true,
      json: async () => ({ success: true }),
    };
  };

  const originalFetch = dependencies.fetch;

  dependencies.fetch = mockFetch as any;

  try {
    const client = new SevDeskClient({ apiKey: "test-key", timeout: 5000 });

    await client.request("https://example.com/api");

    assert.ok(
      capturedSignal instanceof AbortSignal,
      "signal should be AbortSignal"
    );
    assert.is(
      capturedSignal.aborted,
      false,
      "signal should not be aborted yet"
    );
  } finally {
    dependencies.fetch = originalFetch;
  }
});

test("request: throws timeout error when AbortSignal.timeout fires (client config timeout)", async () => {
  const mockFetch = async () => {
    throw new DOMException("The operation was aborted.", "TimeoutError");
  };

  const originalFetch = dependencies.fetch;

  dependencies.fetch = mockFetch as any;

  try {
    const client = new SevDeskClient({ apiKey: "test-key", timeout: 1000 });

    await client.request("https://example.com/api");

    assert.unreachable("Should have thrown an error");
  } catch (error) {
    assert.instance(error, Error);
    assert.is((error as Error).message, "Request timed out");
  } finally {
    dependencies.fetch = originalFetch;
  }
});

test("request: throws timeout error when AbortSignal.timeout fires (request options timeout)", async () => {
  const mockFetch = async () => {
    throw new DOMException("The operation was aborted.", "AbortError");
  };

  const originalFetch = dependencies.fetch;

  dependencies.fetch = mockFetch as any;

  try {
    const client = new SevDeskClient({ apiKey: "test-key" });

    await client.request("https://example.com/api", { timeout: 1000 });

    assert.unreachable("Should have thrown an error");
  } catch (error) {
    assert.instance(error, Error);
    assert.is((error as Error).message, "Request timed out");
  } finally {
    dependencies.fetch = originalFetch;
  }
});

test("request: re-throws network errors", async () => {
  const networkError = new Error("Network request failed");

  const mockFetch = async () => {
    throw networkError;
  };

  const originalFetch = dependencies.fetch;

  dependencies.fetch = mockFetch as any;

  try {
    const client = new SevDeskClient({ apiKey: "test-key" });

    await client.request("https://example.com/api");

    assert.unreachable("Should have thrown an error");
  } catch (error) {
    assert.is(error, networkError);
  } finally {
    dependencies.fetch = originalFetch;
  }
});

test("request: includes Authorization header with API key", async () => {
  let capturedHeaders: HeadersInit | undefined;

  const mockFetch = async (url: string, options?: RequestInit) => {
    capturedHeaders = options?.headers;

    return {
      ok: true,
      json: async () => ({ success: true }),
    };
  };

  const originalFetch = dependencies.fetch;

  dependencies.fetch = mockFetch as any;

  try {
    const client = new SevDeskClient({ apiKey: "test-api-key-123" });

    await client.request("https://example.com/api");

    assert.is(capturedHeaders !== undefined, true);

    const headers = capturedHeaders as Record<string, string>;

    assert.is(headers.Authorization, "test-api-key-123");
    assert.is(headers.Accept, "application/json");
  } finally {
    dependencies.fetch = originalFetch;
  }
});

test("request: merges custom headers with default headers", async () => {
  let capturedHeaders: HeadersInit | undefined;

  const mockFetch = async (url: string, options?: RequestInit) => {
    capturedHeaders = options?.headers;

    return {
      ok: true,
      json: async () => ({ success: true }),
    };
  };

  const originalFetch = dependencies.fetch;

  dependencies.fetch = mockFetch as any;

  try {
    const client = new SevDeskClient({ apiKey: "test-api-key" });

    await client.request("https://example.com/api", {
      headers: { "Custom-Header": "custom-value" },
    });

    assert.is(capturedHeaders !== undefined, true);

    const headers = capturedHeaders as Record<string, string>;

    assert.is(headers.Authorization, "test-api-key");
    assert.is(headers.Accept, "application/json");
    assert.is(headers["Custom-Header"], "custom-value");
  } finally {
    dependencies.fetch = originalFetch;
  }
});

const assertIsInvoice = (invoice: ModelInvoice) => {
  assert.is(invoice.objectName, "Invoice");
};

const assertIsInvoicePos = (position: ModelInvoicePos) => {
  assert.is(position.objectName, "InvoicePos");
};

const assertIsCreditNote = (creditNote: ModelCreditNote) => {
  assert.is(creditNote.objectName, "CreditNote");
};

const assertIsVoucher = (voucher: ModelVoucher) => {
  assert.is(voucher.objectName, "Voucher");
};

const assertIsVoucherPos = (voucher: ModelVoucherPos) => {
  assert.is(voucher.objectName, "VoucherPos");
};

const assertIsDocumentFolder = (document: ModelDocumentFolder) => {
  assert.is(document.objectName, "DocumentFolder");
};

const assertIsDocument = (document: ModelDocument) => {
  assert.is(document.objectName, "Document");
};

const assertIsContact = (contact: ModelContact) => {
  assert.is(contact.objectName, "Contact");
};

const assertIsContactAddress = (contact: ModelContactAddress) => {
  assert.is(contact.objectName, "ContactAddress");
};

const assertIsCommunicationWay = (communicationWay: ModelCommunicationWay) => {
  assert.is(communicationWay.objectName, "CommunicationWay");
};

const assertIsUnity = (unity: ModelUnity) => {
  assert.is(unity.objectName, "Unity");
};

const assertIsPaymentMethod = (paymentMethod: ModelPaymentMethod) => {
  assert.is(paymentMethod.objectName, "PaymentMethod");
};

const assertIsTag = (tag: ModelTag) => {
  assert.is(tag.objectName, "Tag");
};

const assertIsTagRelation = (tag: ModelTagRelation) => {
  assert.is(tag.objectName, "TagRelation");
};

const assertIsSevUser = (user: ModelSevUser) => {
  assert.is(user.objectName, "SevUser");
};

const assertIsStaticCountry = (user: ModelStaticCountry) => {
  assert.is(user.objectName, "StaticCountry");
};

const assertIsPart = (part: ModelPart) => {
  assert.is(part.objectName, "Part");
};

const assertIsBookkeepingSystemVersion = (
  version: ModelBookkeepingSystemVersion
) => {
  assert.is(
    version.version === ModelBookkeepingSystemVersion.VersionEnum.Version10 ||
      version.version === ModelBookkeepingSystemVersion.VersionEnum.Version20,
    true
  );
};

test.run();
