# Creative Task Flow

## Opis aplikacije

**Creative Task Flow** je web aplikacija za upravljanje marketing zadacima i projektima, namenjena timovima koji rade na više kampanja istovremeno i moraju da prate ko šta radi, dokle je stigao i koji su rokovi. U praksi se često dešava da se zadaci izgube u mejlovima, chat porukama i Excel tabelama, što dovodi do propuštenih rokova, duplog rada i slabog uvida u realno stanje kampanja. Motivacija za ovu aplikaciju je da se sve aktivnosti vezane za marketing projekat objedine na jednom mestu, uz jasnu podelu odgovornosti i transparentan tok rada za ceo tim.

Glavni cilj aplikacije Creative Task Flow je da omogući jednostavno planiranje, dodelu, praćenje i dokumentovanje marketing zadataka u okviru projekata i kampanja. Aplikacija treba da podrži menadžere u organizovanju rada tima, definisanju zadataka i praćenju napretka, dok specijalistima olakšava svakodnevni rad time što na jednom mestu vide svoje obaveze, rokove, komentare i fajlove. Pored toga, sistem ima za cilj da obezbedi jasan pregled metrika po projektima i na nivou sistema, kako bi se lakše pratila opterećenost tima i uspešnost realizacije kampanja.

Ciljna grupa korisnika obuhvata pre svega marketing timove unutar agencija i kompanija, gde postoji podela uloga na marketing menadžere i marketing specijaliste. Marketing menadžeri koriste sistem da planiraju kampanje, kreiraju projekte, formiraju timove i dodeljuju zadatke, kao i da prate napredak i performanse. Marketing specijalisti (dizajneri, copywriteri, social media i performance stručnjaci) koriste aplikaciju da pregledaju dodeljene zadatke, ažuriraju status rada, razmenjuju komentare i otpremaju kreativan sadržaj. Administratori sistema čine treću grupu korisnika i odgovorni su za upravljanje korisničkim nalozima, ulogama i globalnim podešavanjima sistema.

## Tehnologije korišćene

- **Frontend:** React (CRA) + JavaScript.  
- **Backend:** PHP **Laravel** (REST API, JSON).  
- **Baza:** **MySQL**.  
- **Dev alatke:** Node.js, Composer, XAMPP (za lokalni rad bez Dockera).  
- **Docker:** Dockerfile + docker-compose (frontend, backend, baza).  
- **Integracije:**  
  - **0x0.st** (javni servis za upload fajlova — u bazi se čuva samo URL link priloga).  
  - **Pexels API** (dohvat slika za potrebe UI-a / sadržaja aplikacije).  

## Pokretanje projekta (lokalno bez Docker-a)

> Instalirani **Node 18+**, **PHP 8.2+**, **Composer**, **XAMPP**.  
> U XAMPP-u pokrenuti: **Apache** i **MySQL**.

1. Klonirajte repozitorijum i pokretanje app:
```bash
git clone https://github.com/elab-development/internet-tehnologije-2025-creative_task_flow_2022_0428.git
```
Backend:
```bash
   cd portal-euprava
   composer install
   php artisan migrate:fresh --seed
   php artisan serve
```
    
Frontend:
```bash
   cd euprava-frontend
   npm install
   npm start
```
## Pokretanje projekta uz Docker

> Instaliran i pokrenut **Docker Desktop**.
> U XAMPP-u pokrenuti: **Apache** (**MySQL** sada pokrece Docker, tako da njega ne pokretati!)

U vec kloniranom repozitorijumu pokrenite docker:
```bash
    docker compose down -v
    docker compose up --build
``` 