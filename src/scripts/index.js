/*
  Файл index.js является точкой входа в наше приложение
  и только он должен содержать логику инициализации нашего приложения
  используя при этом импорты из других файлов

  Из index.js не допускается что то экспортировать
*/
import { getUserInfo, getCardList, setUserInfo, setUserAvatar, addNewCard, deleteCardApi, changeLikeCardStatus} from "./api.js";
import { createCardElement } from "./components/card.js";
import { openModalWindow, closeModalWindow, setCloseModalWindowEventListeners } from "./components/modal.js";
import { enableValidation, clearValidation } from "./components/validation.js";


let currentUserId = null;

// DOM узлы
const placesWrap = document.querySelector(".places__list");
const profileFormModalWindow = document.querySelector(".popup_type_edit");
const profileForm = profileFormModalWindow.querySelector(".popup__form");
const profileTitleInput = profileForm.querySelector(".popup__input_type_name");
const profileDescriptionInput = profileForm.querySelector(".popup__input_type_description");

const cardFormModalWindow = document.querySelector(".popup_type_new-card");
const cardForm = cardFormModalWindow.querySelector(".popup__form");
const cardNameInput = cardForm.querySelector(".popup__input_type_card-name");
const cardLinkInput = cardForm.querySelector(".popup__input_type_url");

const imageModalWindow = document.querySelector(".popup_type_image");
const imageElement = imageModalWindow.querySelector(".popup__image");
const imageCaption = imageModalWindow.querySelector(".popup__caption");

const openProfileFormButton = document.querySelector(".profile__edit-button");
const openCardFormButton = document.querySelector(".profile__add-button");

const profileTitle = document.querySelector(".profile__title");
const profileDescription = document.querySelector(".profile__description");
const profileAvatar = document.querySelector(".profile__image");

const avatarFormModalWindow = document.querySelector(".popup_type_edit-avatar");
const avatarForm = avatarFormModalWindow.querySelector(".popup__form");
const avatarInput = avatarForm.querySelector(".popup__input");

const removeCardPopup = document.querySelector(".popup_type_remove-card");
const removeCardForm = removeCardPopup.querySelector(".popup__form");

const usersStatsModalWindow = document.querySelector(".popup_type_info");
const usersStatsModalTitle = usersStatsModalWindow.querySelector(".popup__title");
const usersStatsModalInfoList = usersStatsModalWindow.querySelector(".popup__info");
const usersStatsModalText = usersStatsModalWindow.querySelector(".popup__text");
const usersStatsModalUserList = usersStatsModalWindow.querySelector(".popup__list");
const logoElement = document.querySelector(".logo");

let cardToDelete = null;
let cardIdToDelete = null;

const renderLoading = (button, isLoading, loadingText = 'Сохранение...', defaultText = 'Сохранить') => {
  button.textContent = isLoading ? loadingText : defaultText;
};

const handlePreviewPicture = ({ name, link }) => {
  imageElement.src = link;
  imageElement.alt = name;
  imageCaption.textContent = name;
  openModalWindow(imageModalWindow);
};

const handleProfileFormSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = evt.submitter;
  renderLoading(submitButton, true);
  setUserInfo(profileTitleInput.value, profileDescriptionInput.value)
    .then((userData) => {
      profileTitle.textContent = userData.name;
      profileDescription.textContent = userData.about;
      closeModalWindow(profileFormModalWindow);
    })
    .catch((err) => {
      console.error('Ошибка:', err)
    })
    .finally(() => {
      renderLoading(submitButton, false)
    });
};

const handleAvatarFormSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = evt.submitter;
  renderLoading(submitButton, true);
  setUserAvatar(avatarInput.value)
    .then((userData) => {
      profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
      closeModalWindow(avatarFormModalWindow);
      avatarForm.reset();
    })
    .catch((err) => {
      console.error('Ошибка:', err)
    })
    .finally(() => {
      renderLoading(submitButton, false)
    });
};

const handleCardFormSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = evt.submitter;
  renderLoading(submitButton, true, 'Создание...', 'Создать');
  addNewCard(cardNameInput.value, cardLinkInput.value)
    .then((newCard) => {
      placesWrap.prepend(
        createCardElement(newCard, {
          onPreviewPicture: handlePreviewPicture,
          onLikeCard: handleLikeCard,
          onDeleteCard: handleDeleteCardClick,
        }, currentUserId) 
      );
      closeModalWindow(cardFormModalWindow);
      cardForm.reset();
    })
    .catch((err) => {
      console.error('Ошибка:', err)
    })
    .finally(() => {
      renderLoading(submitButton, false, 'Создание...', 'Создать')
    });
};

const handleDeleteCardClick = (cardElement, cardId) => {
  cardToDelete = cardElement;
  cardIdToDelete = cardId;
  openModalWindow(removeCardPopup);
};

const handleLikeCard = (likeButton, cardId, likeCountElement) => {
  const isLiked = likeButton.classList.contains("card__like-button_is-active");
  changeLikeCardStatus(cardId, isLiked)
    .then((updatedCard) => {
      likeButton.classList.toggle("card__like-button_is-active");
      likeCountElement.textContent = updatedCard.likes.length;
    })
    .catch((err) => console.error('Ошибка лайка:', err));
};

const formatDate = (date) =>
  date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  
const createInfoString = (term, description) => {
  const template = document.getElementById("popup-info-definition-template");
  const infoElement = template.content.cloneNode(true);
  
  const termElement = infoElement.querySelector(".popup__info-term");
  const descriptionElement = infoElement.querySelector(".popup__info-description");
  
  termElement.textContent = term;
  descriptionElement.textContent = description;
  
  return infoElement;
};

const createUserBadge = (userName) => {
  const template = document.getElementById("popup-info-user-preview-template");
  const userElement = template.content.cloneNode(true);
  
  const badgeElement = userElement.querySelector(".popup__list-item");
  badgeElement.textContent = userName;
  
  return userElement;
};

const handleLogoClick = () => {
  usersStatsModalInfoList.innerHTML = '';
  usersStatsModalUserList.innerHTML = '';
  getCardList()
    .then((cards) => {
      usersStatsModalTitle.textContent = "Статистика пользователей";
      const totalCards = cards.length;
      usersStatsModalInfoList.append(
        createInfoString("Всего карточек:", totalCards.toString())
      );

      if (cards.length > 0) {
        const sortedCards = [...cards].sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        const newestCard = sortedCards[0];
        const oldestCard = sortedCards[sortedCards.length - 1];
        
        usersStatsModalInfoList.append(
          createInfoString(
            "Первая создана:",
            formatDate(new Date(oldestCard.createdAt))
          )
        );
        
        usersStatsModalInfoList.append(
          createInfoString(
            "Последняя создана:",
            formatDate(new Date(newestCard.createdAt))
          )
        );
      }

      const userStats = {};
      
      cards.forEach(card => {
        const ownerId = card.owner._id;
        const ownerName = card.owner.name;        
        if (!userStats[ownerId]) {
          userStats[ownerId] = {
            name: ownerName,
            count: 0
          };
        }
        userStats[ownerId].count++;
      });
      
      const totalUsers = Object.keys(userStats).length;
      usersStatsModalInfoList.append(
        createInfoString("Всего пользователей:", totalUsers.toString())
      );

      const userCounts = Object.values(userStats).map(user => user.count);
      const maxCards = Math.max(...userCounts);
      usersStatsModalInfoList.append(
        createInfoString("Максимум карточек от одного:", maxCards.toString())
      );

      const sortedUsers = Object.values(userStats).sort((a, b) => b.count - a.count);

      usersStatsModalText.textContent = "Все пользователи:";

      sortedUsers.forEach(user => {
        usersStatsModalUserList.append(
          createUserBadge(user.name)
        );
      });
      openModalWindow(usersStatsModalWindow);
    })
    .catch((err) => {
      console.log("Ошибка загрузки статистики:", err);
      usersStatsModalTitle.textContent = "Ошибка загрузки данных";
    });
};


// EventListeners
profileForm.addEventListener("submit", handleProfileFormSubmit);
cardForm.addEventListener("submit", handleCardFormSubmit);
avatarForm.addEventListener("submit", handleAvatarFormSubmit);

openProfileFormButton.addEventListener("click", () => {
  profileTitleInput.value = profileTitle.textContent;
  profileDescriptionInput.value = profileDescription.textContent;
  clearValidation(profileForm, validationSettings);
  openModalWindow(profileFormModalWindow);
});

profileAvatar.addEventListener("click", () => {
  avatarForm.reset();
  clearValidation(avatarForm, validationSettings);
  openModalWindow(avatarFormModalWindow);
});

openCardFormButton.addEventListener("click", () => {
  cardForm.reset();
  clearValidation(cardForm, validationSettings);
  openModalWindow(cardFormModalWindow);
});

removeCardForm.addEventListener("submit", (evt) => {
  evt.preventDefault();
  const submitButton = evt.submitter;
  renderLoading(submitButton, true, 'Удаление...', 'Да');
  deleteCardApi(cardIdToDelete)
    .then(() => {
      cardToDelete.remove();
      closeModalWindow(removeCardPopup);
      cardToDelete = null;
      cardIdToDelete = null;
    })
    .catch((err) => console.error('Ошибка удаления:', err))
    .finally(() => {
      renderLoading(submitButton, false, 'Удаление...', 'Да')
    });
});

logoElement.addEventListener("click", handleLogoClick);

//настраиваем обработчики закрытия попапов
const allPopups = document.querySelectorAll(".popup");
allPopups.forEach((popup) => {
  setCloseModalWindowEventListeners(popup);
});

const validationSettings = {
  formSelector: ".popup__form",
  inputSelector: ".popup__input",
  submitButtonSelector: ".popup__button",
  inactiveButtonClass: "popup__button_disabled",
  inputErrorClass: "popup__input_type_error",
  errorClass: "popup__error_visible",
};

enableValidation(validationSettings);

Promise.all([getUserInfo(), getCardList()])
  .then(([userData, cards]) => {
    currentUserId = userData._id;
    profileTitle.textContent = userData.name;
    profileDescription.textContent = userData.about;
    profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
    
    cards.forEach((cardData) => {
      placesWrap.append(
        createCardElement(cardData, {
          onPreviewPicture: handlePreviewPicture,
          onLikeCard: handleLikeCard,
          onDeleteCard: handleDeleteCardClick,
        }, currentUserId) 
      );
    });
  })
  .catch((err) => {
    console.error('Ошибка загрузки:', err)
  }); 
