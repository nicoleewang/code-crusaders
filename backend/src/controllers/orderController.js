import createHttpError from 'http-errors';
import supabase from '../config/db.js';
import { create } from 'xmlbuilder2';

export const orderFormCreate = async (jsonOrderData) => {
    try {
        // Validate input
        // if (!order || !buyer || !seller || !delivery || !monetaryTotal || !orderLines || !additionalDocumentReference) {
        //     throw createHttpError(400, 'Ensure all fields are filled.');
        // }

        // Generate a unique order ID
        const orderId = Math.floor(Math.random() * 1000000);

        // Insert into the database
        const { data, error } = await supabase
            .from('orders')
            .insert([{ orderId: orderId }])
            .select();

        // If there's an error with the insert
        if (error) {
            throw createHttpError(500, `Failed to insert order: ${error.message}`);
        }

        generateXML(jsonOrderData);
        
        return { orderId: data[0].orderId };  // Return the created order ID

    } catch (error) {
        console.error('Database Error:', error);
        throw createHttpError(500, 'Failed to create order. Please try again.');
    }
};

const generateXML = (jsonOrderData) => {
    const jsonData = {
        "order": {
            "ID": "34",
            "IssueDate": "2010-01-20",
            "IssueTime": "12:30:00",
            "Note": "Information text for the whole order",
            "DocumentCurrencyCode": "SEK",
            "AccountingCostCode": "Project123",
            "ValidityEndDate": "2010-01-31",
            "QuotationDocumentReferenceID": "QuoteID123",
            "OrderDocumentReferenceID": "RejectedOrderID123",
            "OriginatorDocumentReferenceID": "MAFO",
            "ContractID": "34322",
            "ContractType": "FrameworkAgreementID123"
        },
        "buyer": {
            "EndpointID": "7300072311115",
            "ID": "7300070011115",
            "Name": "Johnssons byggvaror",
            "PostalAddress": {
                "StreetName": "Rådhusgatan",
                "AdditionalStreetName": "2nd floor",
                "BuildingNumber": "5",
                "CityName": "Stockholm",
                "PostalZone": "11000",
                "CountrySubentity": "RegionX",
                "CountryCode": "SE"
            },
            "TaxScheme": {
                "RegistrationName": "Herra Johnssons byggvaror AS",
                "CompanyID": "SE1234567801",
                "TaxSchemeID": "VAT"
            },
            "Contact": {
                "Telephone": "123456",
                "Telefax": "123456",
                "Email": "pelle@johnsson.se"
            },
            "Person": {
                "FirstName": "Pelle",
                "MiddleName": "X",
                "FamilyName": "Svensson",
                "JobTitle": "Boss"
            }
        },
        "monetaryTotal": {
            "PayableAmount": {
                "currencyID": "SEK",
                "value": 6225
            }
        },
        "order_lines": [
            {
                "id": "1",
                "note": "Handle with care",
                "quantity": 10,
                "unit_code": "EA",
                "line_extension_amount": 250.00,
                "currency": "SEK",
                "price": {
                    "amount": 25.00,
                    "base_quantity": 1
                },
                "item": {
                    "name": "Wooden Plank",
                    "seller_item_id": "PLANK123",
                    "tax": {
                        "id": "S",
                        "percent": 25,
                        "scheme_id": "VAT"
                    }
                }
            }
        ]
    };
                 
    const xml = create({ version: '1.0', encoding: 'UTF-8' })
        .ele('Order', { xmlns: 'urn:oasis:names:specification:ubl:schema:xsd:Order-2' })
            .ele('cbc:ID').txt(jsonData.order.ID).up()
            .ele('cbc:IssueDate').txt(jsonData.order.IssueDate).up()
            .ele('cbc:IssueTime').txt(jsonData.order.IssueTime).up()
            .ele('cbc:Note').txt(jsonData.order.Note).up()
            .ele('cbc:DocumentCurrencyCode').txt(jsonData.order.DocumentCurrencyCode).up()
            .ele('cbc:AccountingCostCode').txt(jsonData.order.AccountingCostCode).up()
            .ele('cbc:ValidityEndDate').txt(jsonData.order.ValidityEndDate).up()
            .ele('cac:BuyerCustomerParty')
                .ele('cbc:EndpointID').txt(jsonData.buyer.EndpointID).up()
                .ele('cbc:ID').txt(jsonData.buyer.ID).up()
                .ele('cbc:Name').txt(jsonData.buyer.Name).up()
                .ele('cac:PostalAddress')
                    .ele('cbc:StreetName').txt(jsonData.buyer.PostalAddress.StreetName).up()
                    .ele('cbc:AdditionalStreetName').txt(jsonData.buyer.PostalAddress.AdditionalStreetName).up()
                    .ele('cbc:BuildingNumber').txt(jsonData.buyer.PostalAddress.BuildingNumber).up()
                    .ele('cbc:CityName').txt(jsonData.buyer.PostalAddress.CityName).up()
                    .ele('cbc:PostalZone').txt(jsonData.buyer.PostalAddress.PostalZone).up()
                    .ele('cbc:CountrySubentity').txt(jsonData.buyer.PostalAddress.CountrySubentity).up()
                    .ele('cbc:Country')
                        .ele('cbc:IdentificationCode').txt(jsonData.buyer.PostalAddress.CountryCode).up()
                    .up()
                .up()
                .ele('cac:TaxScheme')
                    .ele('cbc:RegistrationName').txt(jsonData.buyer.TaxScheme.RegistrationName).up()
                    .ele('cbc:CompanyID').txt(jsonData.buyer.TaxScheme.CompanyID).up()
                    .ele('cbc:TaxSchemeID').txt(jsonData.buyer.TaxScheme.TaxSchemeID).up()
                .up()
                .ele('cac:Contact')
                    .ele('cbc:Telephone').txt(jsonData.buyer.Contact.Telephone).up()
                    .ele('cbc:Telefax').txt(jsonData.buyer.Contact.Telefax).up()
                    .ele('cbc:ElectronicMail').txt(jsonData.buyer.Contact.Email).up()
                .up()
                .ele('cac:Person')
                    .ele('cbc:FirstName').txt(jsonData.buyer.Person.FirstName).up()
                    .ele('cbc:MiddleName').txt(jsonData.buyer.Person.MiddleName).up()
                    .ele('cbc:FamilyName').txt(jsonData.buyer.Person.FamilyName).up()
                    .ele('cbc:JobTitle').txt(jsonData.buyer.Person.JobTitle).up()
                .up()
            .up()
            .ele('cac:LegalMonetaryTotal')
                .ele('cbc:PayableAmount', { currencyID: jsonData.monetaryTotal.PayableAmount.currencyID })
                    .txt(jsonData.monetaryTotal.PayableAmount.value)
                .up()
            .up()
            .ele('cac:OrderLine')
                .ele('cbc:ID').txt(jsonData.order_lines[0].id).up()
                .ele('cbc:Note').txt(jsonData.order_lines[0].note).up()
                .ele('cbc:Quantity', { unitCode: jsonData.order_lines[0].unit_code })
                    .txt(jsonData.order_lines[0].quantity)
                .up()
                .ele('cbc:LineExtensionAmount', { currencyID: jsonData.order_lines[0].currency })
                    .txt(jsonData.order_lines[0].line_extension_amount)
                .up()
                .ele('cac:Price')
                    .ele('cbc:PriceAmount').txt(jsonData.order_lines[0].price.amount).up()
                    .ele('cbc:BaseQuantity').txt(jsonData.order_lines[0].price.base_quantity).up()
                .up()
                .ele('cac:Item')
                    .ele('cbc:Name').txt(jsonData.order_lines[0].item.name).up()
                    .ele('cbc:SellersItemIdentification')
                        .ele('cbc:ID').txt(jsonData.order_lines[0].item.seller_item_id).up()
                    .up()
                    .ele('cac:ClassifiedTaxCategory')
                        .ele('cbc:ID').txt(jsonData.order_lines[0].item.tax.id).up()
                        .ele('cbc:Percent').txt(jsonData.order_lines[0].item.tax.percent).up()
                        .ele('cbc:TaxSchemeID').txt(jsonData.order_lines[0].item.tax.scheme_id).up()
                    .up()
                .up()
            .up()
        .up()
        .end({ prettyPrint: true });

    console.log(xml);
}