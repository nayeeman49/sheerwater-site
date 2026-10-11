/*
  Sheerwater Consulting: settings you can edit without rebuilding anything.

  email         Where form submissions are delivered when no form service is set up.
                Never shown on the site. Clear it once formEndpoint is working.
  phone         Shown in the footer and on the contact page.
  github        Your GitHub profile URL (used in the footer and on the Lab page).
  formEndpoint  The URL of a free form service, so the forms send straight to
                your inbox. Create a form with a service such as Formspree or
                Web3Forms, then paste its URL here. Leave it empty and the
                forms open the visitor's email app instead.
  formAccessKey Only needed if your form service gives you an access key
                (Web3Forms does). Leave empty for Formspree.
*/
window.SW_CONFIG = {
  email: "",
  phone: "+44 7498 840388",
  github: "https://github.com/nayeeman49",
  formEndpoint: "https://api.web3forms.com/submit",
  formAccessKey: "2696e9a1-194d-4256-8d5c-27f76ef0b08b"
};
