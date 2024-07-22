import { EmbedBuilder } from "discord.js";

export class embedMsg {
  constructor(postData) {
    this.embedImg = {
      index: 0,
      img: postData.images[0],
      size: postData.images.length,
    };

    if (!postData.date) {
      this.dateField = "Posting now";
    } else {
      this.dateField = postData.date;
    }
  }

  regularPost(postData, navigateImg) {
    if (postData.images.length > 1 && navigateImg !== 0) {
      this.navigateImgs(postData.images, navigateImg);
    }

    return new EmbedBuilder()
      .setColor(0x55b24e)
      .setTitle("Post details")
      .setAuthor({
        name: postData.user,
        iconURL: postData.avatar,
      })
      .setDescription(
        "Review your post then confirm it or cancel it! Note: after a minute the operation will be cancelled."
      )
      .addFields({ name: "caption", value: postData?.caption || " " })
      .addFields({ name: "artist", value: postData?.artist || " " })
      .addFields({ name: "source", value: postData?.comment || " " })
      .addFields({
        name: "Date & Time",
        value: this.dateField,
      })
      .addFields({
        name: "images",
        value: `${this.embedImg.index + 1}/${this.embedImg.size}`,
      })
      .setImage(this.embedImg.img)
      .setTimestamp();
  }

  dbPost(postData, extra, commandName, page, navigateImg) {
    let idValue;
    let extraField = {
      name: " ",
      value: " ",
    };
    let description = " ";

    if (postData.images.length > 1 && navigateImg !== 0) {
      console.log("updating image", navigateImg);
      this.navigateImgs(postData.images, navigateImg);
    } else {
      this.embedImg.img = postData.images[0];
    }

    if (!postData.id) idValue = "No ID";
    else idValue = postData.id.toString();

    if (extra?.name === "error") {
      extraField.name = "Error Message";
      extraField.value = extra.value;
    } else if (extra?.name === "archived" && extra?.value) {
      extraField.name = "FB Post ID";
      extraField.value = extra.value.toString();
    }

    if (postData.date) {
      this.dateField = postData.date;
    }

    switch (commandName) {
      case "list-scheduled-posts":
        description = `This post is scheduled on ${this.dateField}`;
        break;
      case "list-today-scheduled-posts":
        description = `This post is scheduled today on ${this.dateField}`;
        break;
      case "list-archived-posts":
        description = `This post was published on ${this.dateField}`;
        break;
      case "list-error-posts":
        description = `This post wasn't published because ${extra.value}`;
        break;
      case "get-post":
        description = ` `;
        break;
    }

    return new EmbedBuilder()
      .setColor(0x7f61a8)
      .setTitle("List Post Details")

      .setDescription(description)

      .addFields({ name: "user", value: postData.user })
      .addFields({ name: "id", value: idValue })
      .addFields({ name: "caption", value: postData?.caption || " " })
      .addFields({ name: "artist", value: postData?.artist || " " })
      .addFields({ name: "source", value: postData?.comment || " " })
      .addFields({
        name: "Date & Time",
        value: this.dateField,
      })
      .addFields({ name: extraField.name, value: extraField.value })
      .addFields({
        name: "images",
        value: `${this.embedImg.index + 1}/${postData.images.length}`,
      })
      .setImage(this.embedImg.img)
      .setTimestamp()
      .setFooter({
        text: page,
      });
  }

  scheduledMsg(postData, status) {
    const dateToday = new Date();
    let title;
    let Description;

    if (status) {
      title = "Just Posted";
      Description = `This post was made on ${dateToday}`;
    } else {
      title = "Error Post";
      Description = `Couldn't make this post that was supposed to be posted on ${dateToday}`;
    }

    return new EmbedBuilder()
      .setColor(0x2986cc)
      .setTitle(title)

      .setDescription(Description)

      .addFields({ name: "user", value: postData.user })
      .addFields({ name: "id", value: postData.id.toString() })
      .addFields({ name: "caption", value: postData?.caption || " " })
      .addFields({ name: "artist", value: postData?.artist || " " })
      .addFields({ name: "source", value: postData?.comment || " " })
      .addFields({
        name: "Date & Time",
        value: this.dateField,
      })
      .addFields({
        name: "images",
        value: `${this.embedImg.index + 1}/${this.embedImg.size}`,
      })
      .setImage(this.embedImg.img)
      .setTimestamp();
  }

  navigateImgs(images, navigateImg) {
    this.embedImg.size = images.length;

    if (navigateImg === 1 && this.embedImg.size !== this.embedImg.index + 1) {
      this.embedImg.index++;
      this.embedImg.img = images[this.embedImg.index];
    } else if (navigateImg === -1 && this.embedImg.index - 1 >= 0) {
      this.embedImg.index--;
      this.embedImg.img = images[this.embedImg.index];
    }
  }
}
