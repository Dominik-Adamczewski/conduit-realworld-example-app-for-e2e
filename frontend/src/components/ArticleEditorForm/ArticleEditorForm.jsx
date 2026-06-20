import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import getArticle from "../../services/getArticle";
import setArticle from "../../services/setArticle";
import FormFieldset from "../FormFieldset";

const emptyForm = { title: "", description: "", body: "", tagList: "" };

function ArticleEditorForm() {
  const { state } = useLocation();
  const normalizeTagList = (tagList) => Array.isArray(tagList) ? tagList.join(", ") : (tagList ?? "");
  const [{ title, description, body, tagList }, setForm] = useState(
    state ? { ...state, tagList: normalizeTagList(state.tagList) } : emptyForm,
  );
  const [errorMessage, setErrorMessage] = useState("");
  const { isAuth, headers, loggedUser } = useAuth();

  const navigate = useNavigate();
  const { slug } = useParams();

  useEffect(() => {
    const redirect = () => navigate("/", { replace: true, state: null });
    if (!isAuth) return redirect();

    if (state || !slug) return;

    getArticle({ headers, slug })
      .then(({ author: { username }, body, description, tagList, title }) => {
        if (username !== loggedUser.username) redirect();

        // Convert tagList array to comma-separated string
        const tagListString = Array.isArray(tagList)
          ? tagList.map((tag) => (typeof tag === "string" ? tag : tag.name)).join(", ")
          : tagList;

        setForm({ body, description, tagList: tagListString, title });
      })
      .catch(console.error);

    return () => setForm(emptyForm);
  }, [headers, isAuth, loggedUser.username, navigate, slug, state]);

  const inputHandler = (e) => {
    const type = e.target.name;
    const value = e.target.value;

    setForm((form) => ({ ...form, [type]: value }));
  };

  const tagsInputHandler = (e) => {
    const value = e.target.value;

    setForm((form) => ({ ...form, tagList: value }));
  };

  const formSubmit = (e) => {
    e.preventDefault();

    // Split tags by comma or space for submission
    const tags = tagList
      .split(/,|\s+/)
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    setArticle({ headers, slug, body, description, tagList: tags, title })
      .then((slug) => navigate(`/article/${slug}`))
      .catch(setErrorMessage);
  };

  return (
    <form onSubmit={formSubmit}>
      <fieldset>
        {errorMessage && <span className="error-messages">{errorMessage}</span>}
        <FormFieldset
          placeholder="Article Title"
          name="title"
          required
          value={title}
          handler={inputHandler}
        ></FormFieldset>

        <FormFieldset
          normal
          placeholder="What's this article about?"
          name="description"
          required
          value={description}
          handler={inputHandler}
        ></FormFieldset>

        <fieldset className="form-group">
          <textarea
            className="form-control"
            rows="8"
            placeholder="Write your article (in markdown)"
            name="body"
            required
            value={body}
            onChange={inputHandler}
          ></textarea>
        </fieldset>

        <FormFieldset
          normal
          placeholder="Enter tags"
          name="tags"
          value={tagList}
          handler={tagsInputHandler}
        >
          <div className="tag-list"></div>
        </FormFieldset>

        <button className="btn btn-lg pull-xs-right btn-primary" type="submit">
          {slug ? "Update Article" : "Publish Article"}
        </button>
      </fieldset>
    </form>
  );
}

export default ArticleEditorForm;
