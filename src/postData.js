export class PostData {
  setDiscordData(user) {
    this.user = user.username;
    this.userid = user.id;
    this.avatar = user.displayAvatarURL();
    this.images = [];
  }

  setSlash(interaction) {
    this.caption = interaction.options.get("caption")?.value;
    this.artist = interaction.options.get("artist")?.value;
    this.date = setDate(
      interaction.options.get("date")?.value,
      interaction.options.get("time")?.value
    );
    this.dateISO = new Date(this.date).toISOString();
  }

  setMsg(str) {
    this.caption = str.split("caption:")[1].split(",")[0].trim();
    this.artist = str.split(", artist:")[1].split(",")[0].trim();
    this.comment = str.split(", source:")[1].split(",")[0].trim();
    this.time = str.split(", time:")[1].split(",")[0].trim();
    this.tempdate = str.split(", date:")[1];
    this.date = setDate(this.tempdate, this.time);
    this.dateISO = new Date(this.date).toISOString();
  }

  setComment(cmnt) {
    this.comment = cmnt;
  }

  // for editing posts
  setEditCmd(interaction, newImg, rowDate) {
    const time = interaction.options.get("time")?.value;
    const date = interaction.options.get("date")?.value;
    let datetime, datetimeiso, tempDate, tempTime;

    if (date && time) {
      datetime = setDate(date, time);
      datetimeiso = new Date(datetime).toISOString();
    } else if (!time && date) {
      tempTime = rowDate.split(", ")[1];
      datetime = setDate(date, tempTime);
      datetimeiso = new Date(datetime).toISOString();
    } else if (!date && time) {
      tempDate = rowDate.split(", ")[0];
      datetime = setDate(tempDate, time);
      datetimeiso = new Date(datetime).toISOString();
    }

    this.arr = [
      { col: "id", value: interaction.options.get("post-id").value },
      { col: "images", value: newImg },
      { col: "caption", value: interaction.options.get("caption")?.value },
      { col: "artist", value: interaction.options.get("artist")?.value },
      { col: "comment", value: interaction.options.get("source")?.value },
      {
        col: "date",
        value: datetime,
      },
      { col: "dateiso", value: datetimeiso },
    ];
  }

  setDBPost(row) {
    this.id = row.id;
    this.user = row.user;
    this.images = [];
    if (row.images?.includes("\n")) {
      this.images = row.images.split(",\n");
    } else this.images.push(row.images);
    this.caption = row.caption;
    this.artist = row.artist;
    this.comment = row.comment;
    this.date = row.date;
    this.dateISO = row.dateiso;
  }
}

function setDate(rawDate, rawTime) {
  if ((!rawDate && !rawTime) || (rawDate && !rawTime)) return null;

  let datetime, date;

  if (!rawDate && rawTime) {
    const currentDate = new Date();

    const day = String(currentDate.getDate());
    const month = String(currentDate.getMonth() + 1); // Note: Months are zero-based
    const year = String(currentDate.getFullYear());

    date = `${year}/${month}/${day}`;

    date += `, ${rawTime}`;
    datetime = new Date(date).toLocaleString();
  } else if (rawDate && rawTime) {
    date = `${rawDate}, ${rawTime}`;
    datetime = new Date(date).toLocaleString();
  }

  if (datetime === "Invalid Date" || datetime?.includes("1970"))
    datetime = null; // sometimes when getting posts from archived_posts the date is set to "1/1/1970, 3:00:00 AM".

  return datetime;
}
