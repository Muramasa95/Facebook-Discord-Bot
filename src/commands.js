import { SlashCommandBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

const commands = [
  new SlashCommandBuilder()
    .setName("picture")
    .setDescription("Make a post with a picture")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("attach-picture")
        .setDescription("Attach a picture")
        .addAttachmentOption((option) =>
          option
            .setName("image_url")
            .setDescription("Attach one image")
        )
        .addStringOption((option) =>
          option.setName("caption").setDescription("The caption of the post")
        )
        .addStringOption((option) =>
          option.setName("artist").setDescription("The artist name")
        )
        .addStringOption((option) =>
          option.setName("source").setDescription("The source of the art")
        )
        .addStringOption((option) =>
          option
            .setName("time")
            .setDescription(
              "Define the time in AM/PM format or 24h format, leave empty to post now. e.g: 3:10 pm."
            )
        )
        .addStringOption((option) =>
          option
            .setName("date")
            .setDescription(
              "Define the date, if left empty and time is defined, the date will set to today. e.g: 2023/6/21."
            )
        )
    ),

  new SlashCommandBuilder()
    .setName("link")
    .setDescription("type in a link to take pictures")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("attach-link")
        .setDescription("Post a link that contains an image")
        .addStringOption((option) =>
          option
            .setName("image_url")
            .setDescription("The link URL")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option.setName("caption").setDescription("The caption of the post")
        )
        .addStringOption((option) =>
          option.setName("artist").setDescription("The artist name")
        )
        .addStringOption((option) =>
          option
            .setName("time")
            .setDescription(
              "Define the time in AM/PM format or 24h format, leave empty to post now. e.g: 3:10 pm."
            )
        )
        .addStringOption((option) =>
          option
            .setName("date")
            .setDescription(
              "Define the date, if left empty and time is defined, the date will set to today. e.g: 2023/6/21."
            )
        )
    ),

  new SlashCommandBuilder()
    .setName("list-today-scheduled-posts")
    .setDescription("list posts scheduled today"),

  new SlashCommandBuilder()
    .setName("list-scheduled-posts")
    .setDescription("list scheduled posts"),

  new SlashCommandBuilder()
    .setName("list-scheduled-posts-minimal")
    .setDescription(
      "list scheduled posts' dates, captions and artists with no embeds"
    ),

  new SlashCommandBuilder()
    .setName("list-today-posts-minimal")
    .setDescription(
      "list the today posts' dates, captions and artists only with no embed"
    ),

  new SlashCommandBuilder()
    .setName("get-post")
    .setDescription("get one post using its id")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("id")
        .setDescription("type in the post id")
        .addStringOption((option) =>
          option.setName("post-id").setDescription("post id").setRequired(true)
        )
    ),

  new SlashCommandBuilder()
    .setName("list-archived-posts")
    .setDescription("list the archived posts")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("posts-count")
        .setDescription(
          "type in how many posts you want, default is 5, max is 20."
        )
        .addStringOption((option) =>
          option.setName("count").setDescription("How many posts")
        )
    ),

  new SlashCommandBuilder()
    .setName("list-error-posts")
    .setDescription("list the error posts")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("posts-count")
        .setDescription(
          "type in how many posts you want, default is 5, max is 20."
        )
        .addStringOption((option) =>
          option.setName("count").setDescription("How many posts")
        )
    ),

  new SlashCommandBuilder()
    .setName("list-deleted-posts")
    .setDescription("list the deleted posts")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("posts-count")
        .setDescription(
          "type in how many posts you want, default is 5, max is 20."
        )
        .addStringOption((option) =>
          option.setName("count").setDescription("How many posts")
        )
    ),

  new SlashCommandBuilder()
    .setName("delete-scheduled-post")
    .setDescription("delete a scheduled post")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("post-id")
        .setDescription(
          "enter the id of the post you want to delete, you can get the id when you list the posts."
        )
        .addStringOption((option) =>
          option
            .setName("post-id")
            .setDescription("the post id")
            .setRequired(true)
        )
    ),

  new SlashCommandBuilder()
    .setName("edit-post-details")
    .setDescription("Allows you to edit scheduled posts by entering their ID")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("edit")
        .setDescription(
          "Enter the attribute you want to edit, you can edit multiple ones"
        )
        .addNumberOption((option) =>
          option
            .setName("post-id")
            .setDescription("Enter the post id")
            .setRequired(true)
        )
        .addAttachmentOption((option) =>
          option.setName("image_url").setDescription("Edit image")
        )

        .addStringOption((option) =>
          option.setName("caption").setDescription("Edit caption")
        )
        .addStringOption((option) =>
          option.setName("artist").setDescription("Edit artist")
        )
        .addStringOption((option) =>
          option.setName("source").setDescription("Edit source")
        )
        .addStringOption((option) =>
          option
            .setName("time")
            .setDescription("Edit the time in AM/PM format or 24h format")
        )
        .addStringOption((option) =>
          option
            .setName("date")
            .setDescription(
              "Edit the date in yyyy/mm/dd format. e.g: 2023/6/21."
            )
        )
    ),

  new SlashCommandBuilder()
    .setName("refresh-today-posts")
    .setDescription("refreshes today posts, use only if a post is missing."),

  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Replies with commands and how to use the bot."),
];

const confirmBtns = [
  new ButtonBuilder()
    .setCustomId("confirm")
    .setLabel("Confirm")
    .setStyle(ButtonStyle.Success),

  new ButtonBuilder()
    .setCustomId("cancel")
    .setLabel("Cancel")
    .setStyle(ButtonStyle.Danger),
];

const imgsBtns = [
  new ButtonBuilder()
    .setCustomId("previousImg")
    .setLabel("Previous Image")
    .setStyle(ButtonStyle.Secondary),

  new ButtonBuilder()
    .setCustomId("nextImg")
    .setLabel("Next Image")
    .setStyle(ButtonStyle.Secondary),
];

const postBtns = [
  new ButtonBuilder()
    .setCustomId("previousPost")
    .setLabel("Previous Post")
    .setStyle(ButtonStyle.Primary),

  new ButtonBuilder()
    .setCustomId("nextPost")
    .setLabel("Next Post")
    .setStyle(ButtonStyle.Primary),
];

export { commands, confirmBtns, imgsBtns, postBtns };
