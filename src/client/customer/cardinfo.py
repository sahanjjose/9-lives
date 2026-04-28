class CardInfo:
    def get_card_info():
        card_number = input("Enter card number: ")
        exp_month = int(input("Enter expiration month: "))
        exp_year = int(input("Enter expiration year: "))
        cvc = input("Enter cvc: ")
        return card_number, exp_month, exp_year, cvc
