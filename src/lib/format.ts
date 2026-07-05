export const WHATSAPP_NUMBER = "447746930857";
export const PHONE_DISPLAY = "+44 7746 930857";
export const BUSINESS_ADDRESS = "66 Paul Street, Greater London, EC2A 4NA, England";
export const BUSINESS_EMAIL = "hello@zanniescollections.com";

export const whatsappLink = (productName: string, formattedPrice: string) => {
  const msg = `Hello Zannies Collections,\nI'm interested in:\nProduct: ${productName}\nPrice: ${formattedPrice}\nCan I get more information?`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
};
