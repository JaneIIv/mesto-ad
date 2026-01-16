const getTemplate = () => {
  return document
    .getElementById("card-template")
    .content.querySelector(".card")
    .cloneNode(true);
};

export const createCardElement = (
  data,
  { onPreviewPicture, onLikeCard, onDeleteCard },
  currentUserId 
) => {
  const cardElement = getTemplate();
  const likeButton = cardElement.querySelector(".card__like-button");
  const deleteButton = cardElement.querySelector(".card__control-button_type_delete");
  const cardImage = cardElement.querySelector(".card__image");
  const likeCountElement = cardElement.querySelector(".card__like-count");

  cardImage.src = data.link;
  cardImage.alt = data.name;
  cardElement.querySelector(".card__title").textContent = data.name;
  
  likeCountElement.textContent = data.likes ? data.likes.length : 0;
  
  const isLiked = data.likes && data.likes.some(user => user._id === currentUserId);
  if (isLiked) {
    likeButton.classList.add("card__like-button_is-active");
  }

  const isOwner = data.owner && data.owner._id === currentUserId;
  if (!isOwner) {
    deleteButton.remove();
  }

  if (onLikeCard) {
    likeButton.addEventListener("click", () => onLikeCard(likeButton, data._id, likeCountElement));
  }

  if (onDeleteCard && isOwner) {
    deleteButton.addEventListener("click", () => onDeleteCard(cardElement, data._id));
  }

  if (onPreviewPicture) {
    cardImage.addEventListener("click", () => onPreviewPicture({name: data.name, link: data.link}));
  }

  return cardElement;
};