import createHttpError from 'http-errors';
import supabase from '../config/db.js';
import { create } from 'xmlbuilder2';

export const orderFormCreate = async (jsonOrderData) => {
  try {
    // Generate a unique order ID
    const orderId = Math.floor(Math.random() * 1000000);
    const xml = generateXML(jsonOrderData, orderId);

    // Insert into the database
    const { data, error } = await supabase
      .from('order')
      .insert([{ orderId: orderId, xml: xml}])
      .select();

    // If there's an error with the insert
    if (error) {
      throw createHttpError(500, `Failed to insert order: ${error.message}`);
    }
    
    return { orderId: data[0].orderId };

  } catch (error) {
    throw createHttpError(500, 'Failed to create order. Please try again.');
  }
};

const generateXML = (jsonOrderData, orderId) => {
  const now = new Date();
  const issueDate = now.toISOString().split("T")[0];
  const issueTime = now.toTimeString().split(" ")[0];
    
  let totalAllowance = 0;
  let totalCharge = 0;

  const xml = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('Order', {
        'xmlns': 'urn:oasis:names:specification:ubl:schema:xsd:Order-2',
        'xmlns:cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
        'xmlns:cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2'
    })
      .ele('cbc:UBLVersionID').txt('2.1').up()
      .ele('cbc:CustomizationID').txt('urn:www.cenbii.eu:transaction:biicoretrdm001:ver1.0').up()
      .ele('cbc:ProfileID', { schemeAgencyID: 'BII', schemeID: 'Profile' }).txt('urn:www.cenbii.eu:profile:BII01:ver1.0').up()
      .ele('cbc:ID').txt(orderId).up()
      .ele('cbc:IssueDate').txt(issueDate).up()
      .ele('cbc:IssueTime').txt(issueTime).up()
      .ele('cbc:Note').txt(jsonOrderData.order.note).up()
      .ele('cbc:DocumentCurrencyCode').txt(jsonOrderData.order.documentCurrencyCode).up()
      .ele('cbc:AccountingCostCode').txt(jsonOrderData.order.accountingCostCode).up()
      .ele('cac:ValidityPeriod')
        .ele('cbc:EndDate').txt(jsonOrderData.order.validityEndDate).up()
      .up()
      .ele('cac:QuotationDocumentReference')
        .ele('cbc:ID').txt(jsonOrderData.order.quotationDocumentReferenceId).up()
      .up()
      .ele('cac:OrderDocumentReference')
        .ele('cbc:ID').txt(jsonOrderData.order.orderDocumentReferenceId).up()
      .up()
      .ele('cac:OriginatorDocumentReference')
        .ele('cbc:ID').txt(jsonOrderData.order.originatorDocumentReferenceId).up()
      .up();

  // Additional Document Reference
  if (jsonOrderData.additionalDocumentReference && jsonOrderData.additionalDocumentReference.length > 0) {
    jsonOrderData.additionalDocumentReference.forEach((doc, index) => {
      let docRef = xml.ele('cac:AdditionalDocumentReference')
          .ele('cbc:ID').txt("doc" + (index + 1)).up()
          .ele('cbc:DocumentType').txt(doc.documentType).up();

      if (doc.attachment) {
          let attachment = docRef.ele('cac:Attachment');
          
          if (doc.attachment.uri) {
              // Handle external reference
              attachment.ele('cac:ExternalReference')
                  .ele('cbc:URI').txt(doc.attachment.uri).up()
              .up();
          } else if (doc.attachment.binaryObject && doc.attachment.mimeCode) {
              // Handle binary object
              attachment.ele('cbc:EmbeddedDocumentBinaryObject')
                  .txt(doc.attachment.binaryObject)
                  .att('mimeCode', doc.attachment.mimeCode)
              .up();
          }
      }

      docRef.up();
    });
  }

  // Contract Section
  xml.ele('cac:Contract')
    .ele('cbc:ID').txt(jsonOrderData.order.contractId).up()
    .ele('cbc:ContractType').txt(jsonOrderData.order.contractType).up()
  .up()

  // Buyer Party
  .ele('cac:BuyerCustomerParty')
    .ele('cac:Party')
        .ele('cbc:EndpointID', { schemeAgencyID: '9', schemeID: 'GLN' }).txt(jsonOrderData.buyer.buyerId).up()
        .ele('cac:PartyIdentification')
          .ele('cbc:ID', { schemeAgencyID: '9', schemeID: 'GLN' }).txt(jsonOrderData.buyer.buyerId).up()
        .up()
        .ele('cac:PartyName')
          .ele('cbc:Name').txt(jsonOrderData.buyer.name).up()
        .up()
        .ele('cac:PostalAddress')
          .ele('cbc:Postbox').txt(jsonOrderData.buyer.postalAddress.postBox).up()
          .ele('cbc:StreetName').txt(jsonOrderData.buyer.postalAddress.streetName).up()
          .ele('cbc:AdditionalStreetName').txt(jsonOrderData.buyer.postalAddress.additionalStreetName).up()
          .ele('cbc:BuildingNumber').txt(jsonOrderData.buyer.postalAddress.buildingNumber).up()
          .ele('cbc:Department').txt(jsonOrderData.buyer.postalAddress.department).up()
          .ele('cbc:CityName').txt(jsonOrderData.buyer.postalAddress.cityName).up()
          .ele('cbc:PostalZone').txt(jsonOrderData.buyer.postalAddress.postalZone).up()
          .ele('cbc:CountrySubentity').txt(jsonOrderData.buyer.postalAddress.countrySubentity).up()
          .ele('cbc:Country')
            .ele('cbc:IdentificationCode').txt(jsonOrderData.buyer.postalAddress.countryCode).up()
          .up()
        .up()
        .ele('cac:PartyTaxScheme')
          .ele('cac:RegistrationAddress')
            .ele('cbc:CityName').txt(jsonOrderData.buyer.postalAddress.cityName).up()
            .ele('cac:Country')
              .ele('cbc:IdentificationCode').txt(jsonOrderData.buyer.postalAddress.countryCode).up()
            .up()
          .up()
          .ele('cbc:TaxScheme', { schemeID: 'UN/ECE 515', schemeAgencyID: '6' })
            .ele('cbc:ID').txt(jsonOrderData.buyer.taxScheme).up()
          .up()
        .up()
        .ele('cac:PartyLegalEntity')
          .ele('cbc:RegistrationName').txt(jsonOrderData.buyer.name).up()
          .ele('cbc:CompanyID', { schemeID: 'SE:ORGNR' }).txt(jsonOrderData.buyer.buyerId).up()
          .ele('cac:RegistrationAddress')
            .ele('cbc:CityName').txt(jsonOrderData.buyer.postalAddress.cityName).up()
            .ele('cbc:CountrySubentity').txt(jsonOrderData.buyer.postalAddress.countrySubentity).up()
            .ele('cac:Country')
              .ele('cbc:IdentificationCode').txt(jsonOrderData.buyer.postalAddress.countryCode).up()
            .up()
          .up()
        .up()
        .ele('cac:Contact')
          .ele('cbc:Telephone').txt(jsonOrderData.buyer.contact.telephone).up()
          .ele('cbc:Telefax').txt(jsonOrderData.buyer.contact.telefax).up()
          .ele('cbc:ElectronicMail').txt(jsonOrderData.buyer.contact.email).up()
        .up()
        .ele('cac:Person')
          .ele('cbc:FirstName').txt(jsonOrderData.buyer.person.firstName).up()
          .ele('cbc:FamilyName').txt(jsonOrderData.buyer.person.familyName).up()
          .ele('cbc:MiddleName').txt(jsonOrderData.buyer.person.middleName).up()
          .ele('cbc:JobTitle').txt(jsonOrderData.buyer.person.jobTitle).up()
        .up()
      .up()
      .ele('cac:DeliveryContact')
        .ele('cbc:Name').txt(jsonOrderData.buyer.deliveryContact.name).up()
        .ele('cbc:Telephone').txt(jsonOrderData.buyer.deliveryContact.telephone).up()
        .ele('cbc:Telefax').txt(jsonOrderData.buyer.deliveryContact.telefax).up()
        .ele('cbc:ElectronicMail').txt(jsonOrderData.buyer.deliveryContact.email).up()
      .up()
  .up()

  // Seller Party
  .ele('cac:SellerSupplierParty')
    .ele('cac:Party')
      .ele('cbc:EndpointID', { schemeAgencyID: '9', schemeID: 'GLN' }).txt(jsonOrderData.seller.sellerId).up()
      .ele('cac:PartyIdentification')
        .ele('cbc:ID').txt(jsonOrderData.seller.sellerId).up()
      .up()
      .ele('cac:PartyName')
        .ele('cbc:Name').txt(jsonOrderData.seller.name).up()
      .up()
      .ele('cac:PostalAddress')
        .ele('cbc:Postbox').txt(jsonOrderData.seller.postalAddress.postBox).up()
        .ele('cbc:StreetName').txt(jsonOrderData.seller.postalAddress.streetName).up()
        .ele('cbc:AdditionalStreetName').txt(jsonOrderData.seller.postalAddress.additionalStreetName).up()
        .ele('cbc:BuildingNumber').txt(jsonOrderData.seller.postalAddress.buildingNumber).up()
        .ele('cbc:Department').txt(jsonOrderData.seller.postalAddress.department).up()
        .ele('cbc:CityName').txt(jsonOrderData.seller.postalAddress.cityName).up()
        .ele('cbc:PostalZone').txt(jsonOrderData.seller.postalAddress.postalZone).up()
        .ele('cbc:CountrySubentity').txt(jsonOrderData.seller.postalAddress.countrySubentity).up()
        .ele('cac:Country')
          .ele('cbc:IdentificationCode').txt(jsonOrderData.seller.postalAddress.countryCode).up()
        .up()
      .up()
      .ele('cac:PartyLegalEntity')
        .ele('cbc:RegistrationName').txt(jsonOrderData.seller.name).up()
        .ele('cbc:CompanyID', { schemeID: 'SE:ORGNR' }).txt(jsonOrderData.seller.sellerId).up()
        .ele('cac:RegistrationAddress')
          .ele('cbc:CityName').txt(jsonOrderData.seller.postalAddress.cityName).up()
          .ele('cbc:CountrySubentity').txt(jsonOrderData.seller.postalAddress.countrySubentity).up()
          .ele('cac:Country')
            .ele('cbc:IdentificationCode').txt(jsonOrderData.seller.postalAddress.countryCode).up()
          .up()
        .up()
      .up()
      .ele('cac:Contact')
        .ele('cbc:Telephone').txt(jsonOrderData.seller.contact.telephone).up()
        .ele('cbc:Telefax').txt(jsonOrderData.seller.contact.telefax).up()
        .ele('cbc:ElectronicMail').txt(jsonOrderData.seller.contact.email).up()
      .up()
      .ele('cac:Person')
        .ele('cbc:FirstName').txt(jsonOrderData.seller.person.firstName).up()
        .ele('cbc:FamilyName').txt(jsonOrderData.seller.person.familyName).up()
        .ele('cbc:MiddleName').txt(jsonOrderData.seller.person.middleName).up()
        .ele('cbc:JobTitle').txt(jsonOrderData.seller.person.jobTitle).up()
      .up()
    .up()
  .up()

  // Originator Customer Party
  .ele('cac:OriginatorCustomerParty')
    .ele('cac:Party')
      .ele('cac:PartyIdentification')
        .ele('cbc:ID', { schemeAgencyID: '9', schemeID: 'GLN' }).txt(jsonOrderData.seller.sellerId).up()
      .up()
      .ele('cac:PartyName')
        .ele('cbc:Name').txt(jsonOrderData.seller.name).up()
      .up()
      .ele('cac:Contact')
        .ele('cbc:Telephone').txt(jsonOrderData.seller.contact.telephone).up()
        .ele('cbc:Telefax').txt(jsonOrderData.seller.contact.telefax).up()
        .ele('cbc:ElectronicMail').txt(jsonOrderData.seller.contact.email).up()
      .up()
      .ele('cac:Person')
        .ele('cbc:FirstName').txt(jsonOrderData.seller.person.firstName).up()
        .ele('cbc:MiddleName').txt(jsonOrderData.seller.person.middleName).up()
        .ele('cbc:FamilyName').txt(jsonOrderData.seller.person.familyName).up()
        .ele('cbc:JobTitle').txt(jsonOrderData.seller.person.jobTitle).up()
      .up()
    .up()
  .up()

  // Delivery Section
  .ele('cac:Delivery')
    .ele('cac:DeliveryLocation')
      .ele('cac:Address')
        .ele('cbc:Postbox').txt(jsonOrderData.delivery.deliveryAddress.postBox).up()
        .ele('cbc:StreetName').txt(jsonOrderData.delivery.deliveryAddress.streetName).up()
        .ele('cbc:AdditionalStreetName').txt(jsonOrderData.delivery.deliveryAddress.additionalStreetName).up()
        .ele('cbc:BuildingNumber').txt(jsonOrderData.delivery.deliveryAddress.buildingNumber).up()
        .ele('cbc:Department').txt(jsonOrderData.delivery.deliveryAddress.department).up()
        .ele('cbc:CityName').txt(jsonOrderData.delivery.deliveryAddress.cityName).up()
        .ele('cbc:PostalZone').txt(jsonOrderData.delivery.deliveryAddress.postalZone).up()
        .ele('cbc:CountrySubentity').txt(jsonOrderData.delivery.deliveryAddress.countrySubentity).up()
        .ele('cac:Country')
          .ele('cbc:IdentificationCode').txt(jsonOrderData.delivery.deliveryAddress.countryCode).up()
        .up()
      .up()
    .up()
    .ele('cac:RequestedDeliveryPeriod')
      .ele('cbc:StartDate').txt(jsonOrderData.delivery.requestedDeliveryPeriod.startDate).up()
      .ele('cbc:EndDate').txt(jsonOrderData.delivery.requestedDeliveryPeriod.endDate).up()
    .up()
    .ele('cac:DeliveryParty')
      .ele('cac:PartyIdentification')
        .ele('cbc:ID', { schemeAgencyID: '9', schemeID: 'GLN' }).txt(jsonOrderData.delivery.deliveryParty.name).up()
      .up()
      .ele('cac:PartyName')
        .ele('cbc:Name').txt(jsonOrderData.delivery.deliveryParty.name).up()
      .up()
      .ele('cac:Contact')
        .ele('cbc:Name').txt(jsonOrderData.delivery.deliveryParty.name).up()
        .ele('cbc:Telephone').txt(jsonOrderData.delivery.deliveryParty.telephone).up()
        .ele('cbc:Telefax').txt(jsonOrderData.delivery.deliveryParty.telefax).up()
        .ele('cbc:ElectronicMail').txt(jsonOrderData.delivery.deliveryParty.email).up()
      .up()
    .up()
  .up()

  // Allowance Charge
  if (jsonOrderData.monetaryTotal.allowanceCharge && jsonOrderData.monetaryTotal.allowanceCharge.length > 0) {
    jsonOrderData.monetaryTotal.allowanceCharge.forEach(charge => {
      xml.ele('cac:AllowanceCharge')
        .ele('cbc:ChargeIndicator').txt(charge.chargeIndicator).up()
        .ele('cbc:AllowanceChargeReason').txt(charge.allowanceChargeReason).up()
        .ele('cbc:Amount', { currencyID: jsonOrderData.order.documentCurrencyCode }).txt(charge.amount).up()
      .up();

      if (charge.chargeIndicator === 'true') {
        totalCharge += charge.amount;
      } else {
        totalAllowance += charge.amount;
      }
    });
  }

  // Tax Total
  xml.ele('cac:TaxTotal')
    .ele('cbc:TaxAmount', { currencyID: jsonOrderData.order.documentCurrencyCode }).txt(jsonOrderData.monetaryTotal.taxTotal).up()
  .up()

  // Anticipated Monetary Total
  .ele('cac:AnticipatedMonetaryTotal')
    .ele('cbc:LineExtensionAmount', { currencyID: jsonOrderData.order.documentCurrencyCode }).txt(jsonOrderData.monetaryTotal.lineExtensionAmount).up()
    .ele('cbc:AllowanceTotalAmount', { currencyID: jsonOrderData.order.documentCurrencyCode }).txt(totalAllowance).up()
    .ele('cbc:ChargeTotalAmount', { currencyID: jsonOrderData.order.documentCurrencyCode }).txt(totalCharge).up()
    .ele('cbc:PayableAmount', { currencyID: jsonOrderData.order.documentCurrencyCode }).txt(jsonOrderData.monetaryTotal.lineExtensionAmount - totalAllowance + totalCharge).up()
  .up()

  // Order Lines
  jsonOrderData.orderLines.forEach((line, index) => {
    let lineItemEle = xml.ele('cac:OrderLine')
      .ele('cbc:Note').txt(line.note).up()
      .ele('cac:LineItem')
        .ele('cbc:ID').txt(index + 1).up()
        .ele('cbc:Quantity', { unitCode: line.lineItem.baseQuantity.unitCode }).txt(line.lineItem.quantity).up()
        .ele('cbc:LineExtensionAmount', { currencyID: jsonOrderData.order.documentCurrencyCode }).txt(line.lineItem.quantity * line.lineItem.price).up()
        .ele('cbc:TotalTaxAmount', { currencyID: jsonOrderData.order.documentCurrencyCode }).txt(line.lineItem.totalTaxAmount).up()
        .ele('cac:Delivery')
          .ele('cbc:RequestedDeliveryPeriod')
            .ele('cbc:StartDate').txt(jsonOrderData.delivery.requestedDeliveryPeriod.startDate).up()
            .ele('cbc:EndDate').txt(jsonOrderData.delivery.requestedDeliveryPeriod.endDate).up()
          .up()
        .up()
        .ele('cbc:Price')
          .ele('cbc:PriceAmount', { currencyID: jsonOrderData.order.documentCurrencyCode }).txt(line.lineItem.price).up()
          .ele('cbc:BaseQuantity', { unitCode: line.lineItem.baseQuantity.unitCode }).txt(line.lineItem.baseQuantity.quantity).up()
        .up()

    let itemEle = lineItemEle.ele('cac:Item')
      .ele('cbc:Description').txt(line.lineItem.item.description).up()
      .ele('cbc:Name').txt(line.lineItem.item.name).up()
      .ele('cac:SellersItemIdentification')
        .ele('cbc:ID').txt(line.lineItem.item.itemId).up()
      .up()

    if (line.lineItem.item.properties && Object.keys(line.lineItem.item.properties).length > 0) {
      Object.entries(line.lineItem.item.properties).forEach(([key, value]) => {
        itemEle.ele('cac:AdditionalItemProperty')
          .ele('cbc:Name').txt(key).up()
          .ele('cbc:Value').txt(value).up()
        .up();
      });
    }

    itemEle.up();
    lineItemEle.up();
  });

  xml.up();

  return xml.end({ prettyPrint: true });
}