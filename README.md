# Facebook-Discord-Bot

This is a Facebook/Discord bot, that takes images and description from discord, then posts them on an FB Page. Written in NodeJS and uses SQLite as a database. It also utilises [Puppeteer](https://pptr.dev/) to srape images from twitter.

## Prequesties 

You have to install [Node.JS](https://nodejs.org/en) and [SQLite](https://www.sqlite.org/) (Note: SQLite can be installed by default in different OSs

## Usage 

1. Clone the repository and install dependencies:-
   ```
    git clone https://github.com/Muramasa95/Facebook-Discord-Bot.git
    cd Facebook-Discord-Bot
    npm ci
   ```
2. now you have to get API keys for Discord, FB and ImgBB. There is an example .env file to see the important variables.
3. after setting up enviromental variables and installing dependencies, now we test the bot using:-

   ```
   npm run start:dev
   ```
   
      this is for testing the bot before deploying, when you save a file the program restarts. To deploy to production:-
      
      ```
      npm run start
      ```
      After running the bot you can use slash command (/help) or send (##help) to see how to use the bot.
      
      You can also build a docker image for this bot using 
      ```
      docker build . -t social-media-bot:latest
      ```
      Note: docker image can be large due to shipping it with Puppeteer, you can remove its lines from the dockerfile to achieve much lesser image size.


